const pendingTasks: Task[] = [];
let _doNotRetry = (reason: any) => false;

function doNotRetry(predicate: (reason: any) => boolean) {
    _doNotRetry = predicate;
}

function enqueue<T>(operation: () => Promise<T>, retry = 10) {
    return new Promise<T>((resolve, reject) => {
        pendingTasks.push({ retry, operation, resolve, reject });
    });
}

function run(task: Task) {
    task.operation()
        .then(value => task.resolve(value))
        .catch(reason => {
            if (task.retry > 0 && !_doNotRetry(reason)) {
                setTimeout(() => {
                    pendingTasks.push(task);
                }, Math.max(1, 10 - task.retry) * 2000);
            } else {
                task.reject(reason);
            }
        });
}

const _timer = setInterval(() => {
    const task = pendingTasks.shift();
    if (task) {
        task.retry--;
        run(task);
    }
}, 40);

type Task = {
    retry: number;
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

export { enqueue };
export default { enqueue, doNotRetry, _timer };
