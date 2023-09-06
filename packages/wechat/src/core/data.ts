import { ChangeType, IChangeItem, IKey, Observer, getObserver } from 'homing';
import { IData } from '../typings/index';
import { joinPath, getValue } from '../utils/data';

type IChangeData = {
  path: IKey[];
} & IChangeItem;

const getChangePathList = (rootObserver: Observer, current: Observer, pathList: IKey[][] = [], path: IKey[] = []) => {
  if (rootObserver === current) {
    pathList.push(path);
  } else if (current.parents.length) {
    current.parents.forEach((parent, index) => {
      getChangePathList(rootObserver, parent, pathList, [current.parentKeys[index], ...path]);
    });
  }

  return pathList;
};

class ChangeMerge {
  list: { key: string; path: IKey[]; start?: number; end?: number }[] = [];

  push(path: IKey[], start?: number, end?: number) {
    this.list.push({
      key: path.join('.') + '.' + (start ? `[N].` : ''),
      path,
      start,
      end
    });
  }

  exec(target: any) {
    if (this.list.length) {
      this.list.sort((v1, v2) => {
        return v1.key > v2.key ? 1 : -1;
      });
      let current: string = this.list[0].key + '.';
      const change: IData = {};
      this.list.forEach((item, _index) => {
        if (item.key.startsWith(current)) {
          return;
        }
        current = item.key;
        if (item.start && item.end) {
          const arr = getValue(target, item.path);
          const path = joinPath(...item.path);
          for (let i = item.start; i < item.end; i++) {
            change[path + `[${i}]`] = arr[i];
          }
        } else {
          change[joinPath(...item.path)] = getValue(target, item.path);
        }
      });

      return change;
    }
  }
}

const getMpInstanceChangeTrace = (instance: IMpInstance, observers: Set<Observer>) => {
  const changeTrace: IChangeData[] = [];
  const rootObserver = getObserver(instance.data);

  if (rootObserver) {
    observers.forEach(observer => {
      const pathList = getChangePathList(rootObserver, observer);
      pathList.forEach(path => {
        observer.changes.forEach(change => {
          changeTrace.push({
            path: path,
            ...change
          });
        });
      });
    });
  }

  return changeTrace;
};

const getMpInstanceChange = (instance: IMpInstance, changeTrace: IChangeData[]) => {
  const changeMerge = new ChangeMerge();

  if (changeTrace.length) {
    changeTrace.forEach(_change => {
      switch (_change.type) {
        case ChangeType.Set:
          changeMerge.push([..._change.path, _change.key]);
          break;
        case ChangeType.ArrayPush:
          if (_change.start === 0) {
            changeMerge.push(_change.path);
          } else {
            changeMerge.push([..._change.path], _change.start, _change.start + _change.items.length);
          }
          break;
        case ChangeType.ArrayPop:
          changeMerge.push([..._change.path, 'length']);
          break;
        case ChangeType.ArraySplice:
        case ChangeType.ArrayShift:
        case ChangeType.ArrayUnshift:
        case ChangeType.ArraySort:
        case ChangeType.ArrayReverse:
          changeMerge.push(_change.path);
          break;
      }
    });
    return changeMerge.exec(instance.data);
  }
};

interface IMpInstance {
  setData: (data: IData, callback?: (() => void) | null, innerChange?: boolean) => void;
  __changedObservers?: Set<Observer>;
  data: IData;
  is: string;
  realCallback: Array<Function> | null;
}

const changedInstance = new Set<IMpInstance>();

export const updateData = (instance: IMpInstance, observer: Observer) => {
  if (!instance.__changedObservers) {
    instance.__changedObservers = new Set<Observer>();
  }
  if (!changedInstance.size) {
    setTimeout(() => {
      //console.log('changedInstance', Array.from(changedInstance))
      console.time('updateData');
      changedInstance.forEach(_instance => {
        if (_instance.__changedObservers) {
          const changeTrace = getMpInstanceChangeTrace(_instance, _instance.__changedObservers);
          const change = getMpInstanceChange(_instance, changeTrace);
          if (change) {
            console.log('[change]', _instance.is, change);
            _instance.setData(
              change,
              () => {
                if (_instance.realCallback?.length) {
                  _instance.realCallback.forEach(fn => {
                    if (fn) fn();
                  });

                  _instance.realCallback = null;
                }
              },
              true
            );
          }
          _instance.__changedObservers.clear();
        }
      });
      changedInstance.clear();
      Observer.clearChange();
      console.timeEnd('updateData');
    }, 16);
  }
  instance.__changedObservers.add(observer);
  changedInstance.add(instance);
};
