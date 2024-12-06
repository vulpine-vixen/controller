'use strict'

// VORZEクラス
const vorze = new Vorze()

// 変数
let leftPower = 0
let downMinusPower = 0
let downAmp = 4
let downPlusPower = 0
let rightPower = 0
let leftPlay = false
let downPlay = false
let rightPlay = false
let usageView = false

// 各ブロック
const leftDiv = document.querySelector('#left-div')
const downDiv = document.querySelector('#down-div')
const rightDiv = document.querySelector('#right-div')
const usageDiv = document.querySelector('#usage-div')

const clearLeftside = () =>
{
    leftPlay = false
    leftPower = 0
    leftPowerDiv.textContent = '+' + leftPower
}

const clearDownside = () =>
{
    downPlay = false
    downMinusPower = 0
    downAmp = 4
    downPlusPower = 0
    downMinusPowerDiv.textContent = '-' + -downMinusPower
    downAmpDiv.textContent = downAmp
    downPlusPowerDiv.textContent = '+' + downPlusPower
}

const clearRightside = () =>
{
    rightPlay = false
    rightPower = 0
    rightPowerDiv.textContent = '+' + rightPower
}
            
// 切断時のコールバック関数
const disconnected = (side) =>
{
    if(side & (vorze.LEFTSIDE | vorze.RIGHTSIDE)){
        leftDiv.classList.add('hidden')
        rightDiv.classList.add('hidden')
        clearLeftside()
        clearRightside()
    }
    if(side & vorze.DOWNSIDE)
    {
        downDiv.classList.add('hidden')
        clearDownside()
    }
}

// 接続ボタン
const connectButton = document.querySelector('#connect')
const connectFun = async(e) =>
{
    connectButton.value = '...'

    // 接続
    const n = await vorze.connect(disconnected)

    // エラー時
    if(!n)
    {
        console.error('VORZE機器と正しく接続できませんでした。')
        connectButton.value = 'Connect'
        return
    }

    // 値を設定
    if(n === vorze.UFO_TW)
    {
        vorze.set(vorze.LEFTSIDE, { power: leftPower / 7 })
        vorze.set(vorze.RIGHTSIDE, { power: rightPower / 7 })
        if(!usageView)
        {
            leftDiv.classList.remove('hidden')
            rightDiv.classList.remove('hidden')
        }
    }
    if(n === vorze.A10_PISTON_SA)
    {
        vorze.set(vorze.DOWNSIDE, {
            pullPower: (Math.pow(2, -downMinusPower) - 1) / 255,
            amplitude: downAmp / 8,
            pushPower: (Math.pow(2, downPlusPower) - 1) / 255,
        })
        if(!usageView)
            downDiv.classList.remove('hidden')
    }
    connectButton.value = 'Connect'
}
connectButton.addEventListener('click', connectFun)

// 値更新関数
const leftUpdate = async(a) =>
{
    if(!a) leftPower = 0
    else leftPower = Math.min(Math.max(-7, leftPower + a), 7)
    if(leftPower > 0) leftPowerDiv.textContent = '+' + leftPower
    else leftPowerDiv.textContent = leftPower
    vorze.set(vorze.LEFTSIDE, {power: leftPower / 7 })
    if(!await vorze.update(vorze.LEFTSIDE))
        console.error('左機の回転力更新に失敗しました。')
}
const downMinusPowerUpdate = async(a) =>
{
    if(!a) downMinusPower = -4
    else downMinusPower = Math.min(Math.max(-8, downMinusPower + a), 0)
    if(downMinusPower !== 0) downMinusPowerDiv.textContent = downMinusPower
    else downMinusPowerDiv.textContent = '-0'
    vorze.set(vorze.DOWNSIDE, {
        pullPower: (Math.pow(2, -downMinusPower) - 1) / 255
    })
    if(!await vorze.update(vorze.DOWNSIDE))
        console.error('下機の引き力更新に失敗しました。')
}
const downAmpUpdate = async(a) =>
{
    if(!a) downAmp = 4
    else downAmp = Math.min(Math.max(1, downAmp + a), 8)
    downAmpDiv.textContent = downAmp
    vorze.set(vorze.DOWNSIDE, {
        amplitude: downAmp / 8
    })
    if(!await vorze.update(vorze.DOWNSIDE))
        console.error('下機の振幅更新に失敗しました。')
}
const downPlusPowerUpdate = async(a) =>
{
    if(!a) downPlusPower = 4
    else downPlusPower = Math.min(Math.max(0, downPlusPower + a), 8)
    downPlusPowerDiv.textContent = '+' + downPlusPower
    vorze.set(vorze.DOWNSIDE, {
        pushPower: (Math.pow(2, downPlusPower) - 1) / 255
    })
    if(!await vorze.update(vorze.DOWNSIDE))
        console.error('下機の押し力更新に失敗しました。')
}
const rightUpdate = async(a) =>
{
    if(!a) rightPower = 0
    else rightPower = Math.min(Math.max(-7, rightPower + a), 7)
    if(rightPower > 0) rightPowerDiv.textContent = '+' + rightPower
    else rightPowerDiv.textContent = rightPower
    vorze.set(vorze.RIGHTSIDE, {power: rightPower / 7 })
    if(!await vorze.update(vorze.RIGHTSIDE))
        console.error('右機の回転力更新に失敗しました。')
}
    
// 左のボタン
const leftPowerDiv = document.querySelector('#left-power-div')
const leftPowerPositiveButton = document.querySelector('#left-power-positive')
const leftPowerPlusButton = document.querySelector('#left-power-plus')
const leftPowerButton = document.querySelector('#left-power')
const leftPowerMinusButton = document.querySelector('#left-power-minus')
const leftPowerNegativeButton = document.querySelector('#left-power-negative')
const leftPowerPositiveFun = (e) => { leftUpdate(20) }
const leftPowerPlusFun = (e) => { leftUpdate(1) }
const leftPowerFun = (e) => { leftUpdate(0) }
const leftPowerMinusFun = (e) => { leftUpdate(-1) }
const leftPowerNegativeFun = (e) => { leftUpdate(-20) }
leftPowerPositiveButton.addEventListener('click', leftPowerPositiveFun)
leftPowerPlusButton.addEventListener('click', leftPowerPlusFun)
leftPowerButton.addEventListener('click', leftPowerFun)
leftPowerMinusButton.addEventListener('click', leftPowerMinusFun)
leftPowerNegativeButton.addEventListener('click', leftPowerNegativeFun)

// 下の引き力のボタン
const downMinusPowerDiv = document.querySelector('#down-minus-power-div')
const downMinusPowerPositiveButton = document.querySelector('#down-minus-power-positive')
const downMinusPowerPlusButton = document.querySelector('#down-minus-power-plus')
const downMinusPowerButton = document.querySelector('#down-minus-power')
const downMinusPowerMinusButton = document.querySelector('#down-minus-power-minus')
const downMinusPowerNegativeButton = document.querySelector('#down-minus-power-negative')
const downMinusPowerPositiveFun = (e) => { downMinusPowerUpdate(10) }
const downMinusPowerPlusFun = (e) => { downMinusPowerUpdate(1) }
const downMinusPowerFun = (e) => { downMinusPowerUpdate(0) }
const downMinusPowerMinusFun = (e) => { downMinusPowerUpdate(-1) }
const downMinusPowerNegativeFun = (e) => { downMinusPowerUpdate(-10) }
downMinusPowerPositiveButton.addEventListener('click', downMinusPowerPositiveFun)
downMinusPowerPlusButton.addEventListener('click', downMinusPowerPlusFun)
downMinusPowerButton.addEventListener('click', downMinusPowerFun)
downMinusPowerMinusButton.addEventListener('click', downMinusPowerMinusFun)
downMinusPowerNegativeButton.addEventListener('click', downMinusPowerNegativeFun)

// 下の振幅のボタン
const downAmpDiv = document.querySelector('#down-amplitude-div')
const downAmpPositiveButton = document.querySelector('#down-amplitude-positive')
const downAmpPlusButton = document.querySelector('#down-amplitude-plus')
const downAmpButton = document.querySelector('#down-amplitude')
const downAmpMinusButton = document.querySelector('#down-amplitude-minus')
const downAmpNegativeButton = document.querySelector('#down-amplitude-negative')
const downAmpPositiveFun = (e) => { downAmpUpdate(10) }
const downAmpPlusFun = (e) => { downAmpUpdate(1) }
const downAmpFun = (e) => { downAmpUpdate(0) }
const downAmpMinusFun = (e) => { downAmpUpdate(-1) }
const downAmpNegativeFun = (e) => { downAmpUpdate(-10) }
downAmpPositiveButton.addEventListener('click', downAmpPositiveFun)
downAmpPlusButton.addEventListener('click', downAmpPlusFun)
downAmpButton.addEventListener('click', downAmpFun)
downAmpMinusButton.addEventListener('click', downAmpMinusFun)
downAmpNegativeButton.addEventListener('click', downAmpNegativeFun)

// 下の押し力のボタン
const downPlusPowerDiv = document.querySelector('#down-plus-power-div')
const downPlusPowerPositiveButton = document.querySelector('#down-plus-power-positive')
const downPlusPowerPlusButton = document.querySelector('#down-plus-power-plus')
const downPlusPowerButton = document.querySelector('#down-plus-power')
const downPlusPowerMinusButton = document.querySelector('#down-plus-power-minus')
const downPlusPowerNegativeButton = document.querySelector('#down-plus-power-negative')
const downPlusPowerPositiveFun = (e) => { downPlusPowerUpdate(10) }
const downPlusPowerPlusFun = (e) => { downPlusPowerUpdate(1) }
const downPlusPowerFun = (e) => { downPlusPowerUpdate(0) }
const downPlusPowerMinusFun = (e) => { downPlusPowerUpdate(-1) }
const downPlusPowerNegativeFun = (e) => { downPlusPowerUpdate(-10) }
downPlusPowerPositiveButton.addEventListener('click', downPlusPowerPositiveFun)
downPlusPowerPlusButton.addEventListener('click', downPlusPowerPlusFun)
downPlusPowerButton.addEventListener('click', downPlusPowerFun)
downPlusPowerMinusButton.addEventListener('click', downPlusPowerMinusFun)
downPlusPowerNegativeButton.addEventListener('click', downPlusPowerNegativeFun)

// 右のボタン
const rightPowerDiv = document.querySelector('#right-power-div')
const rightPowerPositiveButton = document.querySelector('#right-power-positive')
const rightPowerPlusButton = document.querySelector('#right-power-plus')
const rightPowerButton = document.querySelector('#right-power')
const rightPowerMinusButton = document.querySelector('#right-power-minus')
const rightPowerNegativeButton = document.querySelector('#right-power-negative')
const rightPowerPositiveFun = (e) => { rightUpdate(20) }
const rightPowerPlusFun = (e) => { rightUpdate(1) }
const rightPowerFun = (e) => { rightUpdate(0) }
const rightPowerMinusFun = (e) => { rightUpdate(-1) }
const rightPowerNegativeFun = (e) => { rightUpdate(-20) }
rightPowerPositiveButton.addEventListener('click', rightPowerPositiveFun)
rightPowerPlusButton.addEventListener('click', rightPowerPlusFun)
rightPowerButton.addEventListener('click', rightPowerFun)
rightPowerMinusButton.addEventListener('click', rightPowerMinusFun)
rightPowerNegativeButton.addEventListener('click', rightPowerNegativeFun)

// プレイボタン
const leftPlayFun = async(e) => {
    leftPlay = !leftPlay
    if(leftPlay)
    {
        if(!await vorze.play(vorze.LEFTSIDE)) console.error('左機の開始に失敗しました。')
        if(!await vorze.update(vorze.LEFTSIDE)) console.error('左機開始時の更新に失敗しました。')
        leftPlayButton.value = 'Stop'
    }
    else
    {
        if(!vorze.stop(vorze.LEFTSIDE)) console.error('左機の停止に失敗しました。')
        if(!await vorze.update(vorze.LEFTSIDE)) console.error('左機停止時の更新に失敗しました。')
        leftPlayButton.value = 'Play'
    }
}
const leftPlayButton = document.querySelector('#left-play')
leftPlayButton.addEventListener('click', leftPlayFun)
const downPlayFun = async(e) => {
    downPlay = !downPlay
    if(downPlay)
    {
        if(!await vorze.play(vorze.DOWNSIDE)) console.error('下機の開始に失敗しました。')
        if(!await vorze.update(vorze.DOWNSIDE)) console.error('下機開始時の更新に失敗しました。')
        downPlayButton.value = 'Stop'
    }
    else
    {
        if(!vorze.stop(vorze.DOWNSIDE)) console.error('下機の停止に失敗しました。')
        if(!await vorze.update(vorze.DOWNSIDE)) console.error('右機停止時の更新に失敗しました。')
        downPlayButton.value = 'Play'
    }
}
const downPlayButton = document.querySelector('#down-play')
downPlayButton.addEventListener('click', downPlayFun)
const rightPlayFun = async(e) => {
    rightPlay = !rightPlay
    if(rightPlay)
    {
        if(!await vorze.play(vorze.RIGHTSIDE)) console.error('右機の開始に失敗しました。')
        if(!await vorze.update(vorze.RIGHTSIDE)) console.error('右機開始時の更新に失敗しました。')
        rightPlayButton.value = 'Stop'
    }
    else
    {
        if(!vorze.stop(vorze.RIGHTSIDE)) console.error('右機の停止に失敗しました。')
        if(!await vorze.update(vorze.RIGHTSIDE)) console.error('右機停止時の更新に失敗しました。')
        rightPlayButton.value = 'Play'
    }
}
const rightPlayButton = document.querySelector('#right-play')
rightPlayButton.addEventListener('click', rightPlayFun)


// 使い方ボタン
const usageButton = document.querySelector('#usage')
const usageFun = (e) => {
    usageView = !usageView
    if(usageView)
    {
        if(vorze.leftsideConnected) leftDiv.classList.add('hidden')
        if(vorze.downsideConnected) downDiv.classList.add('hidden')
        if(vorze.rightsideConnected) rightDiv.classList.add('hidden')
        usageDiv.classList.remove('hidden')
        usageButton.value = 'もどる'
    }
    else
    {
        if(vorze.leftsideConnected) leftDiv.classList.remove('hidden')
        if(vorze.downsideConnected) downDiv.classList.remove('hidden')
        if(vorze.rightsideConnected) rightDiv.classList.remove('hidden')
        usageDiv.classList.add('hidden')
        usageButton.value = '使い方'
    }
}
usageButton.addEventListener('click', usageFun)