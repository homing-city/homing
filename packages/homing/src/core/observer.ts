import { IChangeItem, IChangeValueSet, IHandle, IKey } from '../typings/index';

let ID = 0;

export class Observer {
  readonly id: number;

  target: any;

  proxy: any;

  constructor(target: any) {
    this.target = target;
    ID++;
    this.id = ID;
  }

  setProxy(proxy: any) {
    this.proxy = proxy;
  }

  static handler: IHandle | null = null;

  static start(handler: IHandle) {
    if (!handler.disposer) {
      handler.disposer = () => {
        handler.disposes?.forEach(handleSet => {
          handleSet.delete(handler);
        });
        handler.disposes = undefined;
      };
    }
    handler.disposer?.();
    this.handler = handler;
  }

  static end() {
    const handler = this.handler;
    this.handler = null;

    return handler?.disposer;
  }

  private static _flushHandles?: Set<IHandle>;

  static flushStart() {
    if (!this._flushHandles) {
      this._flushHandles = new Set<IHandle>();
    }
  }

  static flushEnd() {
    this._flushHandles?.forEach(cb => cb());
    this._flushHandles = undefined;
  }

  private handles: Record<IKey, Set<IHandle>> = {};

  collect(key: IKey) {
    const handler = Observer.handler;
    if (handler) {
      let handles = this.handles[key];
      if (!handles) {
        handles = new Set<IHandle>();
        this.handles[key] = handles;
      }
      handles.add(handler);
      if (!handler.disposes) {
        handler.disposes = [];
      }
      handler.disposes.push(this?.handles[key]);
    }
  }

  static autorun(handle: IHandle) {
    Observer.start(handle);
    handle();
    return Observer.end();
  }

  run(key?: IKey) {
    const handleSet = Observer._flushHandles || new Set();
    if (key) {
      const handles = this.handles[key];
      if (handles) {
        handles.forEach(cb => {
          handleSet.add(cb);
        });
      }
    } else {
      for (const key in this.handles) {
        this.handles[key].forEach(cb => {
          handleSet.add(cb);
        });
      }
      this.parents.forEach((parent, index) => {
        parent.handles[this.parentKeys[index]]?.forEach(cb => {
          handleSet.add(cb);
        });
      });
    }

    if (!Observer._flushHandles) {
      handleSet.forEach(cb => {
        Observer.autorun(cb);
      });
    }
  }

  parents: Observer[] = [];

  parentKeys: IKey[] = [];

  changes: IChangeItem[] = [];

  static changeObservers = new Set<Observer>();

  addParent(key: IKey, parent: Observer) {
    if (!this.parents.includes(parent)) {
      this.parents.push(parent);
      this.parentKeys.push(key);
      return true;
    }
    return false;
  }

  protected _changeHandles: ((item: Observer) => void)[] = [];

  onChange(handle: (item: Observer) => void) {
    this._changeHandles.push(handle);

    return () => {
      this._changeHandles = this._changeHandles.filter(v => handle !== v);
    };
  }

  emitChange(item: Observer) {
    this._changeHandles.forEach(fn => {
      fn(item);
    });
    this.parents.forEach(parent => {
      parent.emitChange(item);
    });
  }

  pushChange(item: IChangeItem) {
    const set = this.changes.find(v => (v as IChangeValueSet).key === (item as IChangeValueSet).key);
    if (set) {
      (set as IChangeValueSet).newValue = (item as IChangeValueSet).newValue;
    } else {
      this.changes.push(item);
      Observer.changeObservers.add(this);
    }
    this.emitChange(this);
  }

  removeParent(parent: Observer) {
    const index = this.parents.indexOf(parent);
    if (index > -1) {
      this.parents.splice(index, 1);
      this.parentKeys.splice(index, 1);
    }
  }

  static clearChange() {
    this.changeObservers.forEach(observer => {
      observer.changes = [];
    });
    this.changeObservers.clear();
  }
}
