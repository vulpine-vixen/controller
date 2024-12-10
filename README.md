# vV Controller

**UFO-TW** や **A10-PISTON-SA** をWeb上で制御できるコントローラーです。

1画面で同時に2機を操作できます。

[vV Controller](https://vulpine-vixen.github.io/controller/)




## UFO-TW

回転の速度 (-7 から +7) を入力できます。

プラスは時計回り、マイナスは反時計回りです。



## A10-PISTON-SA

以下の3つを入力できます。

- 奥に押す速さ (+0 から +8)
    - 内部的には **2 をこの数でべき乗した数 - 1** がバイト値として入力されます。実際に機器に書き込んでみると、大きな値ほど区別が付かないほど速く動く為です。
- 往復距離 (1 から 8)
    - 動く手前の距離を 0 として、 **どのくらい奥まで動くか** を指定できます。
- 手前に引く速さ (-8 から -0)
    - 仕様は押す速さと同様です。



### A10-PISTON-SA の片道の移動にかかるミリ秒の計算

以下はプログラムを書く人向けのお話となります。

機器の動きの見た目から考えた式で近似していますが、
**もっといい方法があれば知らせていただけると幸い** です。

以下がその数式となります。

```math
t = 5800 a \left( 1 - p \right) ^ {64} + 200
```

プログラム (JavaScript) だと以下のようになります。

```javascript
t = 5800 * a * Math.pow(1 - p, 64) + 200
```

- t : 今回得るミリ秒の値です。
- a (0.0 から 1.0) : 動く距離で、本来 0 から 255 の間で機器に書き込むバイト値です。
- p (0.0 から 1.0) : 動く速さで、本来 0 から 255 の間で機器に書き込むバイト値です。
