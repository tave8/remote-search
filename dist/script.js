/**
 * Simple Remote Search library 
 * 
 * How to use:
 * The JSON that is returned from the server
 * must have this format:
 * {
 *  "success": bool,
 *  "errors": [str],
 *  "items": [obj]
 * } 
 * Each object in the items array, must have a 
 * _label property, which will be used 
 * to populate the search input value,
 * as well as the result items list
 * requires bootstrap 5 and jquery 
 * 
 * @author Giuseppe Tavella
 */

class RemoteSearch2 
{
    /**
     * 
     * @param input the id of the search input (where user types)
     * @param url the url to make the request to, where the 
     * query string param "term" will be appended
     * @param when_click callback when user clicks on a list item
     * @param when_success callback when the request is successful
     * @param when_error callback when the request fails
     * @param save_item_id in which html element it you want to save the
     * item.id of the list item clicked
     */
    constructor({ input, 
                  url, 
                  label,
                  min_len=3,
                  when_click, 
                  when_success, 
                  when_error,
                  placeholder,
                  save_item_id }) 
    {
        this.input = input
        this.$input = $("#"+input)
        this.url = url
        // the label of each item
        this.label = label
        // how many characters to have at least, 
        // before triggering the remote request
        this.min_len = min_len
        this.timeout = null
        this.term = null
        this.$list_container = null
        this.save_item_id = save_item_id

        // make the search input not autocomplete,
        // so you don't see suggestions
        this.$input.attr("autocomplete", "off")
        // default placeholder
        placeholder = placeholder ? placeholder : `Inserisci minimo ${min_len} lettere`
        this.$input.attr("placeholder", placeholder)

        // the user-defined callback when
        // a list item is clicked
        this.when_click = when_click
        this.when_success = when_success
        this.when_error = when_error

        var inst = this
        // when document is ready
        $(document).ready(() => {

            // if a list container is not alread set
            // the container that contains the list items
            this.$list_container = $(`<div class="list-group"></div>`)
            // set an id for this list container
            this.$list_container.attr("id", `${this.input}_results_container`)
            // add some css to the list container
            this.$list_container.css({
                "max-height": "200px",
                "overflow-y": "auto",
                "position": "absolute",
                "border": "1px solid lightgray",
                "z-index": "9999"
            })

            // append the list container right below the search input
            this.$input.after(this.$list_container)

            // when user types
            inst.$input.on("keyup", (e) => {
                // clear previous timeout
                clearTimeout(inst.timeout)
                // set new timeout
                inst.timeout = setTimeout(() => {
                    // update the current term
                    inst.term = $(e.target).val()
                    // remote search is triggered only when
                    // search is at least 3 chars
                    if (inst.term.length < inst.min_len) {
                        return
                    }

                    // append the spinner to the list container,
                    // before making the remote request
                    this.$list_container.html("")
                    this.$list_container.append(`
                         <button type="button" 
                              class="list-group-item list-group-item-action" disabled>
                              caricando...
                        </button>
                    `)

                    // all conditions to do the remote request
                    // are satisfied, so do remote request
                    // do remote request
                    inst.do_request_remote({
                        // if response is successful
                        success: (resp) => {
                            if (resp.success) {
                                // assumes the items to make the list of
                                // are in the items property, and
                                // it's an array of objects
                                inst.make_list(resp.items)
                                // user-defined callback, passing the entire response
                                if (inst.when_success) {
                                    inst.when_success(resp)
                                }
                                return
                            }
                            this.error()
                            // the request was not successful
                            if (inst.when_error) {
                                this.when_error()
                            }
                        },
                        // an error occurred during the remote request
                        error: (err) => {
                            this.error()
                            if (inst.when_error) {
                                this.when_error()
                            }
                        }
                    })

                }, 500)
            })  
        })
    }

    error() {
        this.$list_container.html("")
        var $err = $(`
            <button type="button" 
                class="list-group-item list-group-item-action" disabled>
                (errore nei server)
            </button>    
        `)
        this.$list_container.append($err)
        var inst = this
        setTimeout(() => {
            inst.$list_container.html("")
        }, 3000)
        
    }    

    /*
    Do remote request
    */
    do_request_remote({ success, error }) 
    {
        $.ajax({
            url: this.url,
            data: {term: this.term},
            success,
            error
        })
    }

    /*
    Make the result list with the items 
    of the remote request 
    */
    make_list(items)
    {   
        // before making a new list, empty the previous one
        // if one was set
  
        this.$list_container.html("")

        var inst = this
        // the list of list items
        var $list_items = $("<div></div>")

        // if there are no items
        if (items.length === 0) {
            let $no_item = $(`
                <button type="button" 
                              class="list-group-item list-group-item-action">
                              Nessun elemento trovato
                </button>
            `)
            $no_item.on("click", () => {
                // empty the search input as well
                this.$input.val("")
                // when user clicks on "there's no item"
                // the list container is emptied
                inst.$list_container.html("")
            })
            $list_items.append($no_item)
        }
        // there are items 
        else {
            items.forEach(item => {
                // make a single item
                // this is where items appear
                let label = item[inst.get_label()]
                let $list_item = $(`
                      <button type="button" 
                              class="list-group-item list-group-item-action">
                              ${label}
                      </button>
                `)
                // add hover effects to each element
                // not necessary, just adds some nice styling 
                // .hover(
                //     function() {
                //         $(this).css({
                //           'background-color': '#f19532'
                //         });
                //       },
                //       function() {
                //         $(this).css({
                //           'background-color': ''
                //         });
                //       }
                // )

                // when user clicks that specific item
                $list_item.on("click", () => {
                    // empty the list container
                    inst.$list_container.html("")
                    // the search input's value is set to the label
                    inst.$input.val(item[inst.get_label()])

                    // if defined, save into this input, 
                    // automatically save the id of the list item clicked
                    if (inst.save_item_id) {
                        $("#"+inst.save_item_id).val(item.id)
                    }
                    // call the user callback with the item 
                    // that was clicked
                    // pass the item to the user-defined callback
                    if (inst.when_click) {
                        inst.when_click(item)
                    }
                })
                // append each list item to the list
                $list_items.append($list_item)
            })
        }

        // append the list items to the list container
        this.$list_container.append($list_items)

    }

    get_label() {
        return this.label ? this.label : "_label" 
    }

}

