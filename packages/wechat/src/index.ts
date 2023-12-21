import { createProperty, observable, watch, Observer, autorun } from 'homing';
import { OBSERVER_KEY } from './constants/index';
import { updateData } from './core/data';
import { IData, ObservableTarget } from './typings/index';
import { setValue, splitPath } from './utils/data';
import { deepClone } from './utils/index';

/**
 * 观察页面参数
 * @description 将页面参数转为响应式
 */
export const observerPageParams = (
  params: Parameters<WechatMiniprogram.Page.Constructor>[0] & { [OBSERVER_KEY]?: any }
) => {
  if (params[OBSERVER_KEY]) return params;
  params[OBSERVER_KEY] = createProperty(() => true);

  const onLoad = params.onLoad;

  const reactionCleanups: any[] = [];
  const paramsData = params.data || {};
  params.data = {} as any;

  params.onLoad = function (this: WechatMiniprogram.Component.Instance<any, any, any>, ...args) {
    const initData: IData = {};
    const initDataProxy = new Proxy<IData>(initData, {
      get: (_v, key) => {
        const prop = Object.getOwnPropertyDescriptor(paramsData, key);
        return prop?.get ? prop.get?.call(this) : prop?.value;
      },
      set: (v, key, newValue) => {
        v[key] = newValue;
        return true;
      }
    });
    Object.defineProperty(this, 'data', {
      get: () => initDataProxy,
      configurable: true
    });
    for (const key in paramsData) {
      initData[key] = this.data[key];
    }

    const innerData = deepClone(initData);
    const observableData: IData = observable({});

    reactionCleanups.push(
      watch(observableData, changeObserver => {
        updateData(this, changeObserver);
      })
    );

    let _isInnerChange = false;
    Object.defineProperty(this, 'data', {
      get: () => (_isInnerChange ? innerData : observableData)
    });

    const setData = this.setData;
    this.setData = (data: IData, callback: () => void, innerChange?: boolean) => {
      if (innerChange) {
        Observer.end();
        const change: IData = deepClone(data);
        _isInnerChange = true;
        setData.call(this, change, callback);
        _isInnerChange = false;
      } else {
        for (const key in data) {
          setValue(this.data, splitPath(key), data[key]);
        }
        if (!this.realCallback) this.realCallback = [];
        this.realCallback.push(callback);
        Observer.end();
      }
    };
    this.setData(innerData);

    const handles: (() => void)[] = [];
    for (const key in paramsData) {
      const prop = Object.getOwnPropertyDescriptor(paramsData, key);
      const fn = prop?.get ? () => prop.get?.call(this) : () => this.data[key];
      handles.push(() => {
        const state = fn();
        Observer.end();
        this.data[key] = state;
      });
    }
    reactionCleanups.push(
      ...handles.map(handle => {
        return autorun(handle);
      })
    );

    return onLoad?.call(this, ...args);
  };

  const onUnload = params.onUnload;
  params.onUnload = function (...args) {
    reactionCleanups.forEach(fn => {
      if (fn) fn();
    });
    return onUnload?.call(this, ...args);
  };

  return params;
};

/**
 * 观察组件参数
 * @description 将组件参数转为响应式
 */
export const observerComponentParams = (
  params: Parameters<WechatMiniprogram.Component.Constructor>[0] & { [OBSERVER_KEY]?: any }
) => {
  if (params[OBSERVER_KEY]) return params;
  params[OBSERVER_KEY] = createProperty(() => true);

  if (!params.lifetimes) params.lifetimes = {};

  const ready = params.lifetimes.ready || params.ready;

  const reactionCleanups = new WeakMap();
  if (!params.data) params.data = {};
  const _paramsData = {};
  for (const key in params.data) {
    if (Object.hasOwnProperty.call(params.data, key)) {
      const prop = Object.getOwnPropertyDescriptor(params.data, key);
      if (prop?.get) {
        Object.defineProperty(_paramsData, key, prop);
        delete params.data[key];
      }
    }
  }

  params.lifetimes.ready = function (this: WechatMiniprogram.Component.Instance<any, any, any>, ...args) {
    const paramsData = {};
    Object.assign(paramsData, _paramsData, this.data || {});

    const _properties = observable({ ...this.properties });
    const _propertiesMap: PropertyDescriptorMap = {};
    const _that = this as any;
    for (const key in _properties) {
      _propertiesMap[key] = {
        get() {
          return _properties[key];
        },
        set(v) {
          _properties[key] = v;
          _that.setData({ [key]: v });
        }
      };
    }
    Object.defineProperties(this.properties, _propertiesMap);
    this.properties = _properties;

    const initData: IData = {};
    const initDataProxy = new Proxy<IData>(initData, {
      get: (_v, key) => {
        const prop = Object.getOwnPropertyDescriptor(paramsData, key);
        return prop?.get ? prop.get?.call(this) : prop?.value;
      },
      set: (v, key, newValue) => {
        v[key] = newValue;
        return true;
      }
    });
    Object.defineProperty(this, 'data', {
      get: () => initDataProxy,
      configurable: true
    });
    for (const key in paramsData) {
      initData[key] = this.data[key];
    }

    const innerData = deepClone(initData);
    const observableData: IData = observable({});
    if (!reactionCleanups.has(this)) reactionCleanups.set(this, []);
    reactionCleanups.get(this).push(
      watch(observableData, changeObserver => {
        updateData(this, changeObserver);
      })
    );

    let _isInnerChange = false;
    Object.defineProperty(this, 'data', {
      get: () => (_isInnerChange ? innerData : observableData)
    });

    const setData = this.setData;
    this.setData = (data: IData, callback: () => void, innerChange?: boolean) => {
      if (innerChange) {
        Observer.end();
        const change: IData = deepClone(data);
        _isInnerChange = true;
        setData.call(this, change, callback);
        _isInnerChange = false;
      } else {
        for (const key in data) {
          setValue(this.data, splitPath(key), data[key]);
        }
        if (!this.realCallback) this.realCallback = [];
        this.realCallback.push(callback);
        Observer.end();
      }
    };
    this.setData(innerData);

    const handles: (() => void)[] = [];
    for (const key in paramsData) {
      const prop = Object.getOwnPropertyDescriptor(paramsData, key);
      const fn = prop?.get ? () => prop.get?.call(this) : () => this.data[key];
      handles.push(() => {
        const state = fn();
        Observer.end();
        this.data[key] = state;
      });
    }
    reactionCleanups.get(this).push(
      ...handles.map(handle => {
        return autorun(handle);
      })
    );

    ready?.call(this, ...args);
  };

  const detached = params.lifetimes.detached;
  params.lifetimes.detached = function (...args) {
    reactionCleanups.get(this)?.forEach?.((fn: any) => {
      if (fn) fn();
    });
    if (reactionCleanups.has(this)) reactionCleanups.delete(this);
    return detached?.call(this, ...args);
  };

  return params;
};

/**
 * 观察页面
 * @description 将页面转为响应式
 */
export const observerPage = <T extends ObservableTarget<WechatMiniprogram.Page.Constructor>>(target: T) => {
  if (target[OBSERVER_KEY]) return target;

  const page = function (params) {
    return target(observerPageParams(params));
  } as ObservableTarget<T>;

  return Object.defineProperty(page, OBSERVER_KEY, { configurable: true, enumerable: false, value: true });
};

/**
 * 观察组件
 * @description 将组件转为响应式
 */
export const observerComponent = <T extends ObservableTarget<WechatMiniprogram.Component.Constructor>>(target: T) => {
  if (target[OBSERVER_KEY]) return target;

  const component = function (params) {
    return target(observerComponentParams(params));
  } as ObservableTarget<T>;

  return Object.defineProperty(component, OBSERVER_KEY, { configurable: true, enumerable: false, value: true });
};

const globalReference = globalThis as typeof globalThis & {
  Page: WechatMiniprogram.Page.Constructor;
  Component: WechatMiniprogram.Component.Constructor;
};

/**
 * 响应式页面
 */
export const ReactivePage = observerPage(globalReference.Page);

/**
 * 响应式组件
 */
export const ReactiveComponent = observerComponent(globalReference.Component);

/**
 * 自动观察
 * @description 自动观察 `Page` 以及 `Component`
 */
export const autoObserver = () => {
  Object.assign(globalThis, {
    Page: observerPage(Page),
    Component: observerComponent(Component)
  });
};
