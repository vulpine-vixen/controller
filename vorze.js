'use strict'

// UFO-TW と A10-PISTON-SA を保持できるクラス
class Vorze
{
    // 機器名
    UFO_TW = 'UFO-TW'
    A10_PISTON_SA = 'VorzePiston'

    // 場所ビット
    LEFTSIDE = 1
    DOWNSIDE = 2
    RIGHTSIDE = 4
    
    // 機器オブジェクト
    #device = {}
    // 場所オブジェクト
    #side = {}
    // ピストン用のオブジェクト
    #piston = {}
    
    // 初期化
    constructor()
    {
        this.#device[this.UFO_TW] = {}
        this.#device[this.A10_PISTON_SA] = {}
        this.#side[this.LEFTSIDE] = {}
        this.#side[this.DOWNSIDE] = {}
        this.#side[this.RIGHTSIDE] = {}
    }

    // ゲッター
    get leftsideConnected()
    {
        return this.#side[this.LEFTSIDE].connected
    }
    get rightsideConnected()
    {
        return this.#side[this.RIGHTSIDE].connected
    }
    get downsideConnected()
    {
        return this.#side[this.DOWNSIDE].connected
    }
    
    // 接続
    async connect(disconnectFunction)
    {
        // VORZE機器で固定の値
        const SERVICE_UUID = '40ee1111-63ec-4b7f-8ce7-712efd55b90e'
        const CHARACTERISTIC_UUID = '40ee2222-63ec-4b7f-8ce7-712efd55b90e'
    
        // デバイスを列挙し、選択するダイアログ
        const d = await navigator.bluetooth.requestDevice({filters: [{services: [SERVICE_UUID]}]})
        const n = d.name

        // 関係ない機器なら失敗して終わり
        if(
            n !== this.UFO_TW &&
            n !== this.A10_PISTON_SA
        ) return false

        // 既にリストにあったら失敗して終わり
        if(this.#device[n].connected) return false
        
        // 接続
        const server = await d.gatt.connect()
        const service = await server.getPrimaryService(SERVICE_UUID)
        this.#device[n].characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)

        // 値を初期化
        if(n === this.UFO_TW)
        {
            this.#side[this.LEFTSIDE].isPlaying = false
            this.#side[this.LEFTSIDE].connected = true
            this.#side[this.LEFTSIDE].disconnectFunction = disconnectFunction
            this.#side[this.RIGHTSIDE].isPlaying = false
            this.#side[this.RIGHTSIDE].connected = true
            this.#side[this.RIGHTSIDE].disconnectFunction = disconnectFunction
        }
        if(n === this.A10_PISTON_SA)
        {
            this.#side[this.DOWNSIDE].isPlaying = false
            this.#side[this.DOWNSIDE].connected = true
            this.#piston.startTime = 0
            this.#piston.prevTime = 0
            this.#piston.position = 1
            this.#piston.prevWriteTimestamp = -1
            this.#piston.direction = 0
            this.#piston.animationId = -1
            this.#side[this.DOWNSIDE].disconnectFunction = disconnectFunction
        }

        // 接続しているフラグ
        this.#device[n].connected = true
    
        // 切断イベントに登録
        d.addEventListener('gattserverdisconnected', this.#disconnect.bind(this))

        // 成功
        return n
    }

    // 切断
    #disconnect(e)
    {
        // 機器情報を取得
        const n = e.currentTarget.name
    
        // 機器接続フラグを下す
        this.#device[n].connected = false

        if(n === this.UFO_TW)
        {
            // 接続フラグを下す
            this.#side[this.LEFTSIDE].connected = false
            this.#side[this.RIGHTSIDE].connected = false

            // 切断コールバック
            this.#side[this.LEFTSIDE].disconnectFunction(this.LEFTSIDE | this.RIGHTSIDE)
        }
        if(n === this.A10_PISTON_SA)
        {
            // 接続フラグを下す
            this.#side[this.DOWNSIDE].connected = false

            // 切断コールバック
            this.#side[this.DOWNSIDE].disconnectFunction(this.DOWNSIDE)
        }
    }

    // 片道の動きにかかる秒を計算、おそらくこのくらいです
    // 引数の power は 0.0 - 1.0 の間の値で、
    // それを逆転させて 64乗 したものを使用し、
    // 200 ミリ秒から 6000 ミリ秒の間にして返します。
    #sec(amp, power)
    {
        return Math.pow(1 - power, 64) * amp * 5800 + 200
    }

    // ピストンのアニメーション用メソッド
    async #pistonFrame(timestamp)
    {
        this.#piston.animationId = requestAnimationFrame(this.#pistonFrame.bind(this))

        // 現在時刻の処理
        if(!this.#piston.startTime === -1) this.#piston.startTime = timestamp
        let time = timestamp - this.#piston.startTime
        const prevTime = this.#piston.prevTime
        this.#piston.prevTime = time
        const prevWriteTimestamp = this.#piston.prevWriteTimestamp
        
        // 書き込んですぐに書き込むのを防止
        if(timestamp - prevWriteTimestamp < 180) return

        // 記憶しておいたパラメータを読む
        let pullPower = this.#side[this.DOWNSIDE].pullPower
        let amplitude = this.#side[this.DOWNSIDE].amplitude
        let pushPower = this.#side[this.DOWNSIDE].pushPower

        // 移動にかかるミリ秒を計算
        const pushSec = this.#sec(amplitude, pushPower)
        const pullSec = this.#sec(amplitude, pullPower)
        const roundTripSec = pushSec + pullSec

        // 開始時に動き出す場合
        if(prevTime === -1)
        {
            // 引く方の距離と押す方の距離
            //const pullDistance = this.#piston.position
            //const pushDistance = Math.abs(this.#piston.position - amplitude)

            // 必ず手前に動き始め、引く時間分待つ
            this.#piston.direction = -1
            time -= pullSec
        }

        // 動き始める場合の方向
        if(time >= 0)
        {
            if(time % roundTripSec >= pushSec && prevTime % roundTripSec < pushSec) this.#piston.direction = -1
            if(time % roundTripSec < pushSec && prevTime % roundTripSec >= pushSec) this.#piston.direction = 1
        }
        
        // バイトを準備
        let byte1, byte2
        if(this.#piston.direction === 1)
        {
            byte1 = amplitude * 0xFF
            byte2 = pushPower * 0xFF
            this.#piston.position = amplitude
            this.#piston.prevWriteTimestamp = timestamp
            this.#piston.direction = 0
            await this.#write(this.A10_PISTON_SA, 0x03, byte1, byte2)
        }
        else if(this.#piston.direction === -1)
        {
            byte1 = 1
            byte2 = pullPower * 0xFF
            this.#piston.position = 0
            this.#piston.prevWriteTimestamp = timestamp
            this.#piston.direction = 0
            await this.#write(this.A10_PISTON_SA, 0x03, byte1, byte2)
        }
    }

    // ピストン再開始
    #restartPistonFrame()
    {
        // アニメーションを中止
        if(this.#piston.animationId !== -1) cancelAnimationFrame(this.#piston.animationId)

        // 値を初期化
        this.#piston.startTime = -1
        this.#piston.prevTime = -1
        this.#piston.direction = 0

        // 再開始して this を渡す
        this.#piston.animationId = requestAnimationFrame(this.#pistonFrame.bind(this))
    }

    // 開始
    async play(side)
    {
        // 未接続なら失敗
        if(!this.#side[side].connected) return false

        // ピストンの場合はアニメーションを開始
        if(side === this.DOWNSIDE)
        {
            this.#restartPistonFrame()
        }
        // 開始フラグを立てる
        if(!this.#side[side].isPlaying)
        {
            this.#side[side].isPlaying = true
        }

        // 成功
        return true
    }

    // 停止
    stop(side)
    {
        // 未接続なら失敗
        if(!this.#side[side].connected) return false

        // プレイしているフラグを下し、アニメーションを中止
        if(this.#side[side].isPlaying)
        {
            this.#side[side].isPlaying = false
            cancelAnimationFrame(this.#piston.animationId)
            this.#piston.animationId = -1
        }

        // 成功
        return true
    }

    // データを設定
    set(side, data)
    {
        // 左の機器の場合の速さを記憶
        if(side === this.LEFTSIDE && data != undefined)
        {
            if(data.power != undefined) this.#side[side].power = data.power
        }
        // 右の機器の場合の速さを記憶
        else if(side === this.RIGHTSIDE && data != undefined)
        {
            if(data.power != undefined) this.#side[side].power = data.power
        }
        // 下の機器の場合
        else if(side === this.DOWNSIDE && data != undefined)
        {
            if(data.pullPower != undefined) this.#side[side].pullPower = data.pullPower
            if(data.amplitude != undefined) this.#side[side].amplitude = data.amplitude
            if(data.pushPower != undefined) this.#side[side].pushPower = data.pushPower
        }
        else return false

        return true
    }

    // 動きを更新
    async update(side)
    {
        // 左右の機器が接続済みの場合は動き更新
        if((side & (this.LEFTSIDE | this.RIGHTSIDE)) && this.#side[side].connected)
        {
            // 記憶しておいた左右の速さを読む
            let leftPower = this.#side[this.LEFTSIDE].power * 100
            let rightPower = this.#side[this.RIGHTSIDE].power * 100

            // 停止していたら0にする
            if(!this.#side[this.LEFTSIDE].isPlaying) leftPower = 0
            if(!this.#side[this.RIGHTSIDE].isPlaying) rightPower = 0

            // バイトに変換
            const leftByte = (leftPower > 0)? leftPower : 0x80 - leftPower
            const rightByte = (rightPower > 0)? rightPower : 0x80 - rightPower

            // バイト書き込み
            await this.#write(this.UFO_TW, 0x05, leftByte, rightByte)
        }
        // 下機が接続済みの場合は動き更新
        else if((side & this.DOWNSIDE) && this.#side[side].connected)
        {
            // アニメーションを再開始
            if(this.#side[this.DOWNSIDE].isPlaying) this.#restartPistonFrame()
        }
        // 予め設定された機器でなければ失敗
        else if(side & (this.LEFTSIDE | this.DOWNSIDE | this.RIGHTSIDE) === 0)
            return false

        // 成功
        return true
    }
    
    // バイトの書き込み
    async #write(name, byte0, byte1, byte2)
    {
        const byte = new Uint8Array([Math.floor(byte0), Math.floor(byte1), Math.floor(byte2)])
        await this.#device[name].characteristic.writeValue(byte)
    }
}