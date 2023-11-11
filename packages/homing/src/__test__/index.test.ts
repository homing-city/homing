import { observable, autorun } from '..'; // 更改为你的代码文件路径

describe('homing', () => {
  it('应该正确拿到值', () => {
    const obj = { name: 'John' };
    const observedObj = observable(obj);

    expect(observedObj.name).toBe('John');
  });

  it('应该通知观察者', done => {
    const obj = { name: 'John' };
    const observedObj = observable(obj);

    autorun(() => {
      if (observedObj.name === 'Doe') {
        done();
      }
    });

    observedObj.name = 'Doe';
  });

  it('应该处理数组操作', done => {
    const arr = [1, 2, 3];
    const observedArr = observable(arr);

    autorun(() => {
      if (observedArr.includes(4)) {
        done();
      }
    });

    observedArr.push(4);
  });

  it('应该识别嵌套对象的变化', done => {
    const obj = {
      user: {
        name: 'John'
      }
    };
    const observedObj = observable(obj);

    autorun(() => {
      if (observedObj.user.name === 'Doe') {
        done();
      }
    });

    observedObj.user.name = 'Doe';
  });

  it('应该识别嵌套对象的多次变化', done => {
    const obj = {
      users: {
        name: '1',
        name2: '1',
        name3: '1'
      }
    };
    const observedObj = observable(obj);

    autorun(() => {
      if (observedObj.users.name2 === '2' && observedObj.users.name3 === '3') {
        done();
      }
    });

    observedObj.users.name2 = '2';
    observedObj.users.name3 = '3';
  });

  it('应该处理复杂的操作', done => {
    const obj = {
      users: [{ name: 'John' }, { name: 'Doe' }]
    };
    const observedObj = observable(obj);

    autorun(() => {
      if (observedObj.users[2] && observedObj.users[2].name === 'Smith') {
        done();
      }
    });

    observedObj.users.push({ name: 'Smith' });
  });

  it('应该处理自身计算属性', done => {
    class TestStore {
      constructor() {
        return observable(this);
      }

      a = 1;

      get b() {
        return this.a + 1;
      }
    }

    const testStore = new TestStore();

    autorun(() => {
      if (testStore.b === 3) {
        done();
      }
    });

    testStore.a = testStore.a + 1;
  });
});
