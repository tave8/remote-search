
// USAGE: working example

new RemoteSearch({
  // where the user types
  inputSelector: "#box1.remote-search-box > .input-box > input",
  // where results are shown
  // listSelector: ".box-search > .list",
  // min char number to trigger remote search
  minLen: 3,
  // url to make request to
  absoluteUrl: "https://mockup-db.giutav.workers.dev/people",
  // when user clicks the individual result item
  onClickItem: async (item) => {
    console.log("clicked item", item);
  },
  // when the result is received from the server, return the actual items (list of objects)
  getItemsFromResult: (responseData) => {
    // in this case, the items are found exactly in the json itself,
    // so there's no need to search any further
    // if instead the items are found in the json.items property, you must
    // specify that here with return json.items
    return responseData.items;
  },
  // when the results arrive to the client, from the server
  onGetResults: async (responseData, responseObj) => {
    console.log("results arrived", responseData, responseObj);
  },
  // the property that will be displayed to the user in the result item
  // itemLabel: "name",
  // you can customize the item label. this function will be called
  // for each item, passing in the item. you can then set custom logic
  // to display whichever label you want. if this function is not provided,
  // the instance.itemLabel will be used
  setCustomItemLabel: (item) => {
    return item.firstname + " " + item.lastname
  },
  // visually mark/highlight the matching search text, in whatever the final item label will be?
  highlightMatch: true,
  // the search term query string parameter that will contain the value of the input
  searchQueryParam: "q",
  // the query params to append to url before making request
  urlQueryParams: {
    // myParam: "some value",
  },
  // the input placeholder, which can be dynamic as well
  // inputPlaceholder: "Search this field",
  // when the focus is lost on the search input, hide the result list?
  onLoseFocusHideResultList: false,
  // custom function to programmatically position the spinner wherever you want,
  // using as reference point the search input
  // positionSpinner: () => {
  //   return {
  //     top: -25,
  //     left: 270,
  //   };
  // },
  // positionResultList: () => {
  //   return {
  //     top: 0,
  //     left: 0,
  //   };
  // },
});





/**
 * Async versione of setTimeout
 */
// const setTimeoutAsync = (fn, delay=0) => {
//     return new Promise(resolve => setTimeout(() => {
//         fn();
//         resolve();
//     }, delay));
// };


// async function main () {
//     await doSomethingAsync()
//     console.log("done")
// }

// main() 

// async function doSomethingAsync() {
//     await setTimeoutAsync(() => {
//         console.log("doing something")
//     }, 2000)
// }
