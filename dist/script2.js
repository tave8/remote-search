// Only array of objects are accepted.
// So [
// {myLabel: "value"}
// ]

class RemoteSearch {
  constructor({ inputSelector, minLen=3, absoluteUrl, relativeUrl, onClickItem, onGetResult, getItemsFromResult, itemLabel, urlQueryParams={}, inputPlaceholder }) {
    this.inputSelector = inputSelector;
    this.minLen = minLen;
    this.absoluteUrl = absoluteUrl;
    this.relativeUrl = relativeUrl;
    this.onClickItem = onClickItem;
    this.onGetResult = onGetResult;
    this.itemLabel = itemLabel;
    this.urlQueryParams = urlQueryParams;
    this.inputPlaceholder = inputPlaceholder;
    this.getItemsFromResult = getItemsFromResult

    const self = this;

    // CHECKS
    // the TypingDelayer library must exist
    if (!TypingDelayer) {
      throw Error("Must include 'TypingDelayer' library, for this class to work.");
    }

    // start the core typing delay mechanism
    function start() {
      // check that the provided input id resolves to a real html node
      const inputEl = document.querySelector(inputSelector);
      const existsInput = inputEl instanceof HTMLElement;
      // console.log(inputSelector);

      if (!existsInput) {
        throw Error(
          `Error in "RemoteSearch" library. ` +
            `The provided '${inputSelector}' CSS selector, to select the input, resolves ` +
            `to a html node that does not exist.`
        );
      }

      self.createListContainerAndList()
      self.positionList()

      new TypingDelayer(
        {
          inputSelector: self.inputSelector,
          onTypingStopped: self.search,
        },
        { callerContext: self }
      );
    }

    // if the document was loaded
    if (document.readyState == "complete") {
      start();
    }
    // before the document is loaded
    else {
      window.addEventListener("load", () => {
        start();
      });
    }
  }


  /**
   * Use this method to start the search mechanism.
   * The assumption is that this method is called when the user has stopped typing.
   */
  async search(inputValue, moreInfo) {
    // check that the input value length is greater or equal the min length
    if (inputValue.length < this.minLen) {
      return 
    }
    
    // console.log(inputValue)
    // console.log(this);
    const responseData = await this.getRequest()
    
    const items = this.getItemsFromResult(responseData)

    this.createList(items, responseData)
  }

  async getRequest() {
    let url = "";
    let urlWithQstr = "";

    // was the absolute or relative url provided
    if (this.absoluteUrl) {
      url = this.absoluteUrl;
    } else if (this.relativeUrl) {
      url = this.relativeUrl;
    } else {
      throw Error("No url provided.");
    }

    const qstr = RemoteSearch.paramsToQueryStr(this.urlQueryParams);

    urlWithQstr = `${url}?${qstr}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error("errore nei server");
    }

    const data = await resp.json();
 
    return data;
  }

  createList(items, responseData) {
    const self = this
    // empty list always 

    // there are no items
    if (items.length == 0) {
    }
    // there's more than one item
    else {
      items.forEach(item => {
        // the label of each item. this will be shown
        // to the user in the UI list item
        const label = item[this.itemLabel]
        const listItemEl = self.createListItem(label, item)
        // .appendChild(listItemEl)
        console.log(listItemEl)
      })
    }
  }

  createListItem(label, item) {
    const listItemEl = document.createElement("li")
    // the list item text
    listItemEl.innerText = label
    // when user clicks list item
    listItemEl.addEventListener("click", () => {
      // empty list 

      // set the value of the search input as the result item clicked
      document.querySelector(self.inputSelector).value = label
      // run the user-provided callback when clicking the item
      self.onClickItem(item)
    })
    return listItemEl
  }

  createListContainerAndList() {
    const inputEl = document.querySelector(this.inputSelector)
    const searchContainerEl = inputEl.closest(".remote-search-box")

    const listContainerEl = document.createElement("div")
    const listEl = document.createElement("ul")

    listContainerEl.classList.add("list-box")

    listContainerEl.appendChild(listEl)
    searchContainerEl.appendChild(listContainerEl)
  }

  positionList() {
    const inputEl = document.querySelector(this.inputSelector)
    const inputCoord = inputEl.getBoundingClientRect();
    console.log(inputCoord)
      //     <div class="list-box">
      //   <ul>
      //     <li>list item 1</li>
      //     <li>list item 2</li>
      //     <li>list item 3</li>
      //   </ul>
      // </div>
  }

  static paramsToQueryStr(params) {
    return new URLSearchParams(params).toString();
  }
}

// USAGE

new RemoteSearch({
  // where the user types
  inputSelector: ".remote-search-box > .input-box > input",
  // where results are shown
  // listSelector: ".box-search > .list",
  // min char number to trigger remote search
  minLen: 3,
  // url to make request to
  absoluteUrl: "https://jsonplaceholder.typicode.com/users",
  // when user clicks the individual result item
  onClickItem: async (id, moreInfo) => {
    console.log(id, moreInfo);
  },
  // when the result is received from the server, return the actual items (list of objects) 
  getItemsFromResult: (responseData) => {
    // in this case, the items are found exactly in the json itself, 
    // so there's no need to search any further 
    // if instead the items are found in the json.items property, you must 
    // specify that here with return json.items
    return responseData
  },
  // when the results arrive to the client, from the server
  onGetResult: async (respBody) => {
    console.log(respBody);
  },
  // the property that will be displayed to the user in the result item
  itemLabel: "name",
  // the query params to append to url before making request
  urlQueryParams: {
    x: 2,
  },
  // the input placeholder, which can be dynamic as well
  inputPlaceholder: "Search all (min _N_ required)",
});
