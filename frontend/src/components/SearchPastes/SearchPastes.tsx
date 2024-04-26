import {Component, createResource, createSignal, JSX, Show} from 'solid-js';
import {A} from '@solidjs/router';
import ApiClient from '../../api/client';
import {PasteSearchView} from '../../api/model/PasteSearchView';
import {toDateTimeString} from '../../datetime/DateTimeUtil';
import styles from "./searchPastes.module.css";

type SearchPastesProps = {
  term: String
  pastes: PasteSearchView
  onSearchEnter: (term: String) => void
}

const SearchPastes: Component<SearchPastesProps> = ({term, pastes, onSearchEnter}): JSX.Element => {

  const [search, setSearch] = createSignal<string>();

  const [results, { refetch }] = createResource(() => search(), () => searchTerm());

  let searchInput: HTMLInputElement;


  const searchTerm = (): Promise<Array<PasteListView>> => {
    if (search() && search().length >= 3) {
      return ApiClient.searchAll(search());
    }

    return Promise.resolve([]);
  }

  const resetSearchForm = () => {
    setSearch(null);
    refetch();
  }


  const submitOnClick = (e: Event) => {
    e.preventDefault();
    if (searchInput.value?.length >= 3) {
      onSearchEnter(searchInput.value);
    }
  }

  const submitOnEnter = (e: Event) => {
    e.preventDefault();

    if (searchInput.value?.length >= 3) {
      if (e instanceof KeyboardEvent && e.key === "Enter") {
        onSearchEnter(searchInput.value);
      }
    }
  }

  return (
    <>
      <form autocomplete="off" class={styles.searchForm} onSubmit={submitOnClick}>
        <fieldset>
          <input ref={searchInput} onKeyUp={submitOnEnter} value={term} type="search" required minlength="3" maxlength="25" placeholder="Search for pastes" autofocus />
          <input type="submit" value="Search"/>
          <input type="reset" value="Reset"/>
        </fieldset>
      </form>

      <Show when={term}>
      <Show when={pastes.length} keyed fallback={<p>Nothing found</p>}>

      <ol styles={styles.searchResults}>
        <For each={pastes}>{item =>
        <li class={styles.item}>
          <p><A href={'/paste/' + item.id}>{item.title || 'Untitled' }</A></p>
          <p>
            Created: <time>{toDateTimeString(item.dateCreated)}</time> |
            Expires: <time>{item.dateOfExpiry ? toDateTimeString(item.dateOfExpiry) : 'Never'}</time> |
            Size: {item.sizeInBytes} bytes
          </p>
          <pre><i>“{item.highlight} [..]”</i></pre>
        </li>
        }
        </For>
      </ol>

      </Show>
      </Show>

    </>
  )
}

export default SearchPastes
