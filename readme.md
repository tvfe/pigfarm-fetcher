# 以伪协议配置化的形式定义你的请求

### 最简易用法
1. 注册请求器
```
var fetcher = require('pigfarm-fetcher');
var request = require('request');

fetcher.registerRequestor('http', function(cfg) {
    return new Promise((rs, rj)=> {
        request(cfg.url, function(err, res) {
            err ? rj() : rs();
        })    
    })
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
try {
    var result = await requestIndex({
        ptag: 'pigfarm'
    });
    console.log(result);
} catch(e) {
    console.error(e);
}
```

### 意义
将远程调用所涉及的上下游事务分为三层，分别适合负责解决团队疑难杂症的同学，开启业务项目的同学，以及后续维护业务的同学编写。

如此分层也适合在不同执行环境下进行facade模式。