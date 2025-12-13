class RemoteSearch {
  constructor() {}
}

// USAGE



new RemoteSearch({
  input_id: "committenti_search",
  list_id: "committenti_list",
  min_len: 3,
  placeholder: "Cerca tutto (min _N_ caratteri)",

  url: "/crm/ajax2/getCommittentiByQuery.php",
  label: "ragione_sociale",
  // this is triggered on success
  on_item_click: when_click_committente,
  query_params: {
    stato: "attivo",
  },
});

remote_search.when_get_results(quando_arrivano_risultati_di_ricerca);



async function remote_get_dipendenti(id_committente) {
  const qstr = _to_qstr({
    id_committente,
  });
  const url = `/crm/ajax2/committenti/get-dipendenti`;
  const final_url = `${url}?${qstr}`;
  const resp = await fetch(final_url);
  if (!resp.ok) {
    throw new Error("errore nei server");
  }
  const data = await resp.json();
  if (!data.success) {
    throw new Error("errore nei server");
  }
  return data.items;
}



/**
 * Fai una richiesta remota asincrona con il metodo GET.  
 * */ 
async function _remote_request({ url, params={} }) 
{
    if (!(typeof url === 'string')) {
        throw new Error("L'url deve essere una stringa")
    }
    if (!(typeof params === 'object')) {
        throw new Error("I parametri della query, prima di essere "
                        +"convertiti in stringa, devono essere un oggetto")
    }
    const qstr = (new URLSearchParams(params)).toString()
    const final_url = `${url}?${qstr}`

    let resp = null
    try {
        resp = await fetch(final_url)
    }
    catch (e) {
        throw new Error(`errore nel client prima/durante `
                        +`l'invio della richiesta remota: ${e.message}`)
    }

    if (!resp.ok) { 
        throw new Error(`errore dopo richiesta remota. `
                        +`status code: ${resp.status}`) 
    }
    
    // prova a convertire il corpo della risposta in json
    let resp_json = null
    try {
        resp_json = await resp.json()
    }
    catch (e) {
        throw new Error(`errore dopo la richiesta remota, `
                       +`durante il parsing del corpo della `
                       +`richiesta in json: ${e.message}`)
    }

    if (!resp_json.success) { 
        let errors_str = "[nessun errore specificato dal server, "
                         +"o l'attributo per gli errori non e' un array]"
        if (Array.isArray(resp_json.errors)) {
            errors_str = resp_json.errors.join(', ')
        }
        throw new Error(`errore dopo richiesta remota: motivazione: `
                      +`nel corpo json della risposta, l'attributo che `
                      +`indica il successo della risposta e' falso o inesistente. `
                      +`errori: ${errors_str}`) 
    }
    // ritorna tutto il corpo della risposta in json/oggetto js
    return resp_json
}


function _to_qstr(params) {
    return (new URLSearchParams(params)).toString()
}

function _get_query_params() {
    return new URLSearchParams(window.location.search)
}

function _get_query_param(param) {
    return _get_query_params().get(param)
}


