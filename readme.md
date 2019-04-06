# pigfarm-fetcher
以伪协议的形式配置你的请求

## change log
* 1.0 请求器是一个func，最终请求返回promise，日志通过`fetcher.on('log', fn)`来注册钩子打印。
* 2.0 <br>
    1. 每个请求器不再是一个func, 而是一个包含`request`和`compile`两个方法的对象，这么做是为了让请求器内部能够配置私有的属性
    2. 请求器自己管理日志。

### 2.0 最简易用法
1. 注册请求器
```
var fetcher = require('pigfarm-fetcher');
var request = require('request');

fetcher.registerRequestor('http', {
    compile: function (cfg) {
        /* prehandle */
    },
    request: function(cfg) {
        return new Promise((rs, rj)=> {
            request(cfg.url, function(err, res) {
                err ? rj() : rs();
            })    
        })
    }
});
```

2. 通过配置创建请求
```
var requestIndex = fetcher.build({
    url: 'http://v.qq.com?ptag={ptag}'
})
```

3. 执行请求
```
requestIndex({
    ptag: 'pigfarm'
}).then(res => {
    console.log(res)
}).catch(err => {
    console.log(err)
})

```

### 意义
将远程调用所涉及的上下游事务分为三层，分别适合负责解决团队疑难杂症的同学，开启业务项目的同学，以及后续维护业务的同学编写。

如此分层也适合在不同执行环境下进行facade模式。同一个协议，在不同的环境下注册不同的请求器，自然就可以无缝移植请求配置。