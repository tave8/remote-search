// Only array of objects are accepted.
// So [
// {myLabel: "value"}
// ]

class RemoteSearch {
  constructor({ inputSelector, listSelector, minLen, absoluteUrl, relativeUrl, onClickItem, onGetResult, itemLabel, urlQueryParams, inputPlaceholder }) {
    this.inputSelector = inputSelector;
    this.listSelector = listSelector;
    this.minLen = minLen;
    this.absoluteUrl = absoluteUrl;
    this.relativeUrl = relativeUrl;
    this.onClickItem = onClickItem;
    this.onGetResult = onGetResult;
    this.itemLabel = itemLabel;
    this.urlQueryParams = urlQueryParams;
    this.inputPlaceholder = inputPlaceholder;

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
    // console.log(inputValue)
    // console.log(this);
    const json = await this.getRequest()
    console.log(json)
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

  createList() {}

  createListItem() {}

  static paramsToQueryStr(params) {
    return new URLSearchParams(params).toString();
  }
}

// USAGE

new RemoteSearch({
  // where the user types
  inputSelector: ".box-search > input",
  // where results are shown
  listSelector: ".box-search > .list",
  // min char number to trigger remote search
  minLen: 3,
  // url to make request to
  absoluteUrl: "https://jsonplaceholder.typicode.com/users",
  // when user clicks the individual result item
  onClickItem: async (id, moreInfo) => {
    console.log(id, moreInfo);
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
