# `homing`

> 这是一个强大的响应式库，使您能够轻松观察和响应对象属性的更改。



## ✨特性

- **轻松观察**: 使任何对象变为可观察的，无论是简单对象还是数组。
- **自动运行**: 当观察的对象发生变化时，自动执行相关的操作。



## 📦安装

```bash
npm install homing
```



## 使用



### 使对象变为可观察的

```typescript
import { observable } from 'homing';

const obj = observable({
  name: 'Alice',
  age: 25
});

class Store {
    count = 0
    
 	constructor() {
        return observable(this);
    }
}

const store = new Store()
```



### 自动响应更改

```typescript
import { autorun } from 'homing';

const data = observable({
  count: 0
});

autorun(() => {
  console.log(data.count);
});

data.count = 5; // Console: 5
```



