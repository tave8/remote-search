// TO IMPLEMENT
// when user clicks out of list input, or when input loses focus, list disappears
// on window resize, set a timeout mechanism with clear last timeout and set new timeout, to reposition the list underneath the input
// when click item, fill an input value
// when click item,

// Only array of objects are accepted.
// So [
// {myLabel: "value"}
// ]

class RemoteSearch {
  constructor({
    inputSelector,
    minLen = 3,
    absoluteUrl,
    relativeUrl,
    onClickItem,
    onGetResults,
    getItemsFromResult,
    itemLabel,
    urlQueryParams = {},
    inputPlaceholder,
    searchQueryParam = "search_term",
    onLoseFocusHideResultList = true,
    setCustomItemLabel,
    highlightMatch = false,
    positionSpinner,
    positionResultList,
    positionSpinnerRightInput = true,
    positionResultListUnderInput = true,
  }) {
    this.inputSelector = inputSelector;
    this.minLen = minLen;
    this.absoluteUrl = absoluteUrl;
    this.relativeUrl = relativeUrl;
    this.onClickItem = onClickItem;
    this.onGetResults = onGetResults;
    this.itemLabel = itemLabel;
    this.urlQueryParams = urlQueryParams;
    this.inputPlaceholder = inputPlaceholder;
    this.getItemsFromResult = getItemsFromResult;
    this.searchQueryParam = searchQueryParam;
    this.onLoseFocusHideResultList = onLoseFocusHideResultList;
    this.highlightMatch = highlightMatch;
    this.positionSpinnerRightInput = positionSpinnerRightInput;
    this.positionResultListUnderInput = positionResultListUnderInput;
    // if no function to set the item label is provided,
    // then the value of the item label is considered at instance.itemLabel
    // for example, if itemLabel is "name", then the result list the items
    // will appear as having their item["name"] value
    this.setCustomItemLabel = setCustomItemLabel
      ? setCustomItemLabel
      : function (item) {
          return item[itemLabel];
        };

    this.positionSpinner = positionSpinner
      ? positionSpinner
      : function () {
          return {
            top: 0,
            left: 0,
          };
        };

    this.positionResultList = positionResultList
      ? positionResultList
      : function () {
          return {
            top: 0,
            left: 0,
          };
        };

    this.input = null;
    this.list = null;
    this.listContainer = null;

    const self = this;

    // CHECKS
    // the TypingDelayer library must exist
    if (!TypingDelayer) {
      throw Error("Must include 'TypingDelayer' library, for this class to work.");
    }

    // if the document was loaded
    if (document.readyState == "complete") {
      self.init();
    }
    // before the document is loaded
    else {
      window.addEventListener("load", self.init.bind(self));
    }
  }

  /**
   * Called only once on instantiation.
   */
  init() {
    const self = this;

    // check that the provided input id resolves to a real html node
    const inputEl = document.querySelector(this.inputSelector);
    const existsInput = inputEl instanceof HTMLElement;
    // console.log(inputSelector);

    if (!existsInput) {
      throw Error(
        `Error in "RemoteSearch" library. ` +
          `The provided '${this.inputSelector}' CSS selector, to select the input, resolves ` +
          `to a html node that does not exist.`
      );
    }

    this.createListContainerAndList();

    // set more instance properties
    this.input = inputEl;
    this.listContainer = inputEl.closest(".remote-search-box").querySelector(".list-box");
    this.list = this.listContainer.querySelector("ul");

    this.spinner = this.createSpinner();
    this.positionSpinnerNearInput();
    
    
    // initially center the list container,
    // then when window resizes, re-center it again
    self.positionListUnderInput();
    self.positionSpinnerNearInput();
    window.addEventListener("resize", () => {
      self.positionListUnderInput();
      self.positionSpinnerNearInput();
    });
    
    this.input.addEventListener("keyup", (ev) => {
      // this must be here, with a keyup listener, because
      // the value must be updated only when the user has finished
      // typing that char
      self.inputValue = self.input.value;
    });

    // when the user types
    // update the input value, as soon as the user types in
    this.input.addEventListener("keydown", (ev) => {
      self.showListContainerBorder(false);
      self.emptyList();
    });

    // configure: if input loses focus, should the result list
    // stay or go away?
    if (this.onLoseFocusHideResultList) {
      this.input.addEventListener("focusout", () => {
        self.emptyList();
        self.showListContainerBorder(false);
      });
    }

    // fire the search method after delay from when user stops typing
    new TypingDelayer(
      {
        inputSelector: this.inputSelector,
        onTypingStopped: this.searchAfterTypingStopped,
      },
      { callerContext: this }
    );
  }

  /**
   * Use this method to start the search mechanism.
   * The assumption is that this method is called when the user has stopped typing.
   */
  async searchAfterTypingStopped(inputValue, moreInfoAfterWaitTyping) {
    // check that the input value length is greater or equal the min length
    if (inputValue.length < this.minLen) {
      return;
    }

    // show spinner when user has stopped typing and the typing delay has expired,
    // right before making the remote request
    this.showSpinner();

    // console.log(inputValue)
    // console.log(this);
    const responseData = await this.doGetRequest();

    // hide spinner right after the remote results have arrived
    this.showSpinner(false);

    const items = this.getItemsFromResult(responseData);

    this.refreshList(items, responseData);
  }

  async doGetRequest() {
    const respObj = await fetch(this.getFinalUrl());

    if (!respObj.ok) {
      throw new Error("errore nei server");
    }

    const responseData = await respObj.json();

    // fire the user-defined callback as soon as data is arrived
    // and available
    if(this.onGetResults) {
      this.onGetResults(responseData, respObj)
    }

    return responseData;
  }

  refreshList(items, responseData) {
    const self = this;

    this.showListContainerBorder();

    // there are no items
    if (items.length == 0) {
    }
    // there's more than one item
    else {
      items.forEach((item) => {
        const listItemEl = self.createListItem(item);
        self.list.appendChild(listItemEl);
        // console.log(listItemEl);
      });
    }
  }

  /**
   * Show/hide the spinner that is used to show the user that "the data is being loaded".
   * The spinner should be displayed from time START and hidden on time END, where:
   * time START = the first moment after (user stops typing + delay)
   * time END = when remote results have arrived
   */
  showSpinner(show = true) {
    if (show) {
      this.spinner.classList.remove("hide");
    } else {
      this.spinner.classList.add("hide");
    }
  }

  /**
   * When a result list item gets clicked.
   */
  handleClickItem(item) {
    const self = this;
    // empty list
    self.emptyList();
    // hide the list container border
    this.showListContainerBorder(false);
    // set the value of the search input as the result item clicked
    self.input.value = this.setCustomItemLabel(item);
    // run the user-provided callback when clicking the item
    self.onClickItem(item);
  }

  /**
   * Creates the individual result list item.
   */
  createListItem(item) {
    const self = this;
    const listItemEl = document.createElement("li");
    // the user can provide a function to customize
    // how each list item will be displayed
    // if no custom function is provided, the provided itemLabel
    // value will be used
    let label = this.setCustomItemLabel(item);

    if (this.highlightMatch) {
      // in the label, wrap around the matching search term, the bold tags
      // which means "highlighting"
      const labelWithHighlight = this.highlightMatchingSearch(label);
      listItemEl.innerHTML = labelWithHighlight;
    } else {
      listItemEl.innerText = label;
    }

    // when user clicks list item
    listItemEl.addEventListener("click", () => {
      self.handleClickItem.bind(self)(item);
    });

    return listItemEl;
  }

  createListContainerAndList() {
    const inputEl = document.querySelector(this.inputSelector);
    const searchContainerEl = inputEl.closest(".remote-search-box");

    const listContainerEl = document.createElement("div");
    const listEl = document.createElement("ul");

    // initially removes the border
    listContainerEl.classList.add("list-box", "no-border");

    listContainerEl.appendChild(listEl);
    searchContainerEl.appendChild(listContainerEl);
  }

  createSpinner() {
    const inputBoxEl = this.input.closest(".remote-search-box").querySelector(".input-box");
    const spinnerEl = document.createElement("span");
    spinnerEl.classList.add("loader", "hide");
    inputBoxEl.appendChild(spinnerEl);
    return spinnerEl;
  }


  /**
   * In the item label, highlight the current input value.
   * This helps the user see what their input value has matched,
   * for each list item label.
   */
  highlightMatchingSearch(label) {
    if (!this.inputValue) return label;

    const escaped = this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");

    return label.replace(regex, "<span class='remote-search-highlight-match'>$&</span>");
  }

  positionSpinnerNearInput() {
    const inputRect = this.input.getBoundingClientRect();

    let left = inputRect.left + window.scrollX;
    let top = inputRect.top + window.scrollY;

    if (this.positionSpinnerRightInput) {
      const inputWidth = inputRect.width;
      const inputHeight = inputRect.height;
      left = left + inputWidth - 30;
      top = top + inputHeight / 5;
    } else {
      const { left: leftCustom, top: topCustom } = this.positionSpinner();
      left = left + leftCustom;
      top = top + topCustom;
    }

    this.spinner.style.position = "absolute";
    this.spinner.style.left = `${left}px`;
    this.spinner.style.top = `${top}px`;
  }

  positionListUnderInput() {
    const inputRect = this.input.getBoundingClientRect();

    let left = inputRect.left + window.scrollX;
    let top = inputRect.top + window.scrollY;

    if (this.positionResultListUnderInput) {
      const inputWidth = inputRect.width;
      const inputHeight = inputRect.height;
      left = left;
      top = top + inputHeight;
    } else {
      const { left: leftCustom, top: topCustom } = this.positionResultList();
      left = left + leftCustom;
      top = top + topCustom;
    }

    this.listContainer.style.position = "absolute";
    this.listContainer.style.left = `${left}px`;
    this.listContainer.style.top = `${top}px`;
  }

  showListContainerBorder(show = true) {
    // removes the no-border class from list container,
    if (show) {
      this.listContainer.classList.remove("no-border");
    } else {
      this.listContainer.classList.add("no-border");
    }
  }

  emptyList() {
    this.list.innerHTML = "";
  }

  getFinalUrl() {
    let url = "";

    // was the absolute or relative url provided
    if (this.absoluteUrl) {
      url = this.absoluteUrl;
    } else if (this.relativeUrl) {
      url = this.relativeUrl;
    } else {
      throw Error("No url provided.");
    }

    return `${url}?${this.getUrlQueryStr()}`;
  }

  getUrlQueryParams() {
    // the user-provided or default search query param, for example:
    // search_term, term ecc.
    // this will result in the query string having that parameter, example:
    // search_term="mary poppins"
    const searchQueryParam = {
      [this.searchQueryParam]: this.input.value,
    };
    // the user-provided query params
    // creating a new object and giving priority to searchQueryParam,
    // which will override any param in this.urlQueryParams
    return Object.assign({}, this.urlQueryParams, searchQueryParam);
  }

  getUrlQueryStr() {
    return RemoteSearch.paramsToQueryStr(this.getUrlQueryParams());
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
  onClickItem: async (item) => {
    console.log("clicked item", item);
  },
  // when the result is received from the server, return the actual items (list of objects)
  getItemsFromResult: (responseData) => {
    // in this case, the items are found exactly in the json itself,
    // so there's no need to search any further
    // if instead the items are found in the json.items property, you must
    // specify that here with return json.items
    return responseData;
  },
  // when the results arrive to the client, from the server
  onGetResults: async (responseData, responseObj) => {
    console.log("results arrived", responseData, responseObj);
  },
  // the property that will be displayed to the user in the result item
  itemLabel: "name",
  // you can customize the item label. this function will be called
  // for each item, passing in the item. you can then set custom logic
  // to display whichever label you want. if this function is not provided,
  // the instance.itemLabel will be used
  setCustomItemLabel: (item) => {
    if (item.email.endsWith("biz")) {
      return `${item.website} - ${item.name}`;
    }
    return item.name;
  },
  // visually mark/highlight the matching search text, in whatever the final item label will be?
  highlightMatch: true,
  // the search term query string parameter that will contain the value of the input
  searchQueryParam: "term",
  // the query params to append to url before making request
  urlQueryParams: {
    x: 2,
  },
  // the input placeholder, which can be dynamic as well
  inputPlaceholder: "Search all (min _N_ required)",
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
