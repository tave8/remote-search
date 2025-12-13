/**
 * Async versione of setTimeout
 */
const setTimeoutAsync = (fn, delay=0) => {
    return new Promise(resolve => setTimeout(() => {
        fn();
        resolve();
    }, delay));
};


async function main () {
    await doSomethingAsync()
    console.log("done")
}

main() 

async function doSomethingAsync() {
    await setTimeoutAsync(() => {
        console.log("doing something")
    }, 2000)
}
