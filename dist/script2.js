class RemoteSearch {
  constructor() {}
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
  url: "/crm/ajax2/getCommittentiByQuery.php",
  // when user clicks the individual result item
  onClickItem: async (id, moreInfo) => {
    console.log(id, moreInfo)
  },
  // when the results arrive to the client, from the server
  onGetResult: async (respBody) => {
    console.log(respBody)
  },
  // the property that will be displayed to the user in the result item
  itemLabel: "name",
  // the query params to append to url before making request
  urlQueryParams: {
    x: 2
  },
  // the input placeholder, which can be dynamic as well
  inputPlaceholder: "Search all (min _N_ required)",
})




