# `@homing/wechat`

> 这是一个用于微信小程序的库。



## ✨特性

它利用`homing`库为小程序的页面和组件提供了响应式功能。

- **自动观察**: 通过 `autoObserver` 将页面和组件自动变为响应式的观察者。
- **共享 store**: 多个页面或组件之间共享同一数据源。
- **data 响应式更新**: `data` 之间相互依赖自动更新。
- **props 响应式更新**: `data` 和 `props` 之间相互依赖自动更新。
- **最小更新**: 只有真正更改的数据部分会被更新。
- **聚合更新**: 在16ms内的多次更新会合并为一次，减少性能开销。

这些特性的目的是提高数据的响应性，使数据更易于管理，并优化性能。



## 📦安装

> 确保安装并了解 [`homing`](https://github.com/homing-city/homing/tree/main/packages/homing#readme) 的使用。

```bash
npm i @homing/wechat
```



## 使用

`@homing/wechat` 提供了以下 `API`：

- `observerPageParams`: 观察页面参数
- `observerComponentParams`: 观察组件参数
- `observerPage`: 观察页面
- `observerComponent`: 观察组件
- `ReactivePage`: 响应式页面
- `ReactiveComponent`: 响应式组件
- `autoObserver`: 自动观察



### 观察

首先我们需要先建立 `homing` 和 `wechat` 之间的观察关系。



#### 自动观察

为了方便，我们提供了自动观察方法，只需要代码上下文最前方使用 `autoObserver`：

```typescript
import { autoObserver } from '@homing/wechat';

autoObserver();
```

这样 `@homing/wechat` 就会自动注入 `Page` 和 `Component`，将他们变成响应式的观察者。



#### 手动观察

如果你不希望每一个页面和组件都是响应式的，那么你可以使用 `ReactivePage` 和 `ReactiveComponent` 来分别创建组件和页面。

```typescript
import { ReactivePage, ReactiveComponent } from '@homing/wechat';

ReactivePage({
    data: {}
})

ReactiveComponent({
    data: {}
})
```

这样就可以按需使用了。



### 依赖

接下来我们看下如何使用 `homing` 创建的 `Store`：

```typescript
import { userStore } from './store.ts';

Page({
    data: {
        get userInfo(){
            return userStore.userInfo
        }
    }
})
```

我们只需要在 `data` 中的 `getter` 中引用返回即可。



## 效果

我们可以看看具体使用中会有哪些效果。



### 共享  store

> 你可以创建一个共享的 `store`，并通过使用 `observable` 使其可观察。

页面内的数据可以基于这个共享`store`进行定义和更新。

```typescript
class Store {
  value1 = 1;

  constructor() {
    return observable(this);
  }
}

const store = new Store();

Page({
  data: {
    get value2() {
      return store.value1 + 10;
    }
  }
});
```

通过直接更改 `store` 内的值，可以影响依赖于该 `store` 的页面数据。

```typescript
store.value1++;
```



### data 响应式更新

> 使用 `get` 关键字，你可以定义一个属性，该属性的值取决于其他属性。

例如在页面内，当 `value1` 的值更改时，由于 `value2` 是基于 `value1` 的，`value2` 的值也会相应地更改。

```typescript
Page({
  data: {
    value1: 1,
    get value2() {
      return this.data.value1 + 10;
    }
  }
});
```

更新方式 1

```typescript
this.data.value1++;
```

更新方式 2

```
this.setDate({
  value1: this.data.value1 + 1
});
```



###  props  响应式更新

> 在组件内，你可以使用 `properties` 定义一个属性，并使用 `data` 和 `get` 关键字使其基于该属性动态更改。

因此如下所示，当 `value1` 更改时，`value2` 也会随之更改。

```typescript
Component({
  properties: {
    value1: {
      type: Number
    }
  },
  data: {
    get value2() {
      return this.properties.value1 + 10;
    }
  }
});
```



### 通过依赖收集生成最小的更新数据

> 在复杂数据类型中，我们会根据数据的路径依赖进行最小范围的更新。

先看如下示例：

```typescript
class Store {
  info = { infoA: 1, infoB: 2 };

  constructor() {
    return observable(this);
  }
}

const store = new Store();

Page({
  data: {
    get Info() {
      return store.info;
    }
  }
});
```

当我们更新时：

```typescript
store.infoA++;
```

对应的效果：

```typescript
this.setData({
  'Info.infoA': 2
});
```



### 聚合更新

> 所有更新每 `16` 毫秒收集一次变更数据，同时触发，减少 `setData` 的真实触发次数。

先看如下示例：

```typescript
class Store {
  info = { infoA: 1, infoB: 2 };

  constructor() {
    return observable(this);
  }
}

const store = new Store();

Page({
  data: {
    get Info() {
      return store.info;
    }
  }
});
```

当我们更新时：

```typescript
store.infoA++;
store.infoA++;
```

对应的效果：

```typescript
this.setData({
  'Info.infoA': 3
});
```

