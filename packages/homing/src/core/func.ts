import { IHandle } from '../typings/index';
import { getObserver } from '../utils/index';
import { Observer } from './observer';

export const autorun = (handle: IHandle) => {
  Observer.start(handle);
  handle();
  return Observer.end();
};

/**
 *
 * @param handle
 */
export const flushRun = (handle: IHandle) => {
  Observer.flushStart();
  handle();
  Observer.flushEnd();
};

/**
 * 无延时的执行内容
 * @param handle
 */
export const runWithoutDelay = (_handle: IHandle) => {
  //TODO
};

export const watch = (data: any, onChange: (changeObserver: Observer, rootObserver: Observer) => void) => {
  const observer = getObserver(data);

  return observer?.onChange(changeObserver => {
    onChange(changeObserver, observer);
  });
};
