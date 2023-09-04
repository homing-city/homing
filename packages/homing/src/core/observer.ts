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

  static disposer: any = null;

  static start(handler: IHandle) {
    this.disposer = null;
    this.handler = handler;
  }

  static end() {
    this.handler = null;
    return this.disposer;
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
      Observer.disposer = () => {
        this?.handles[key].delete(handler);
      };
    }
  }

  run(key?: IKey) {
    if (key) {
      const handles = this.handles[key];
      if (handles) {
        if (Observer._flushHandles) {
          handles.forEach(cb => {
            Observer._flushHandles?.add(cb);
          });
        } else {
          handles.forEach(cb => cb());
        }
      }

      return !!handles?.size;
    } else {
      const handles = Observer._flushHandles || new Set<IHandle>();
      for (const key in this.handles) {
        this.handles[key].forEach(cb => {
          handles.add(cb);
        });
      }
      this.parents.forEach((parent, index) => {
        parent.run(this.parentKeys[index]);
      });

      if (!Observer._flushHandles) {
        handles.forEach(cb => cb());
      }

      return !!handles.size;
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
