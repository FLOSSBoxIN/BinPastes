import {A} from '@solidjs/router';
import {createResource, For, JSX, Match, onCleanup, onMount, Show, Switch} from 'solid-js';
import ApiClient from '../../api/client';
import {PasteListView} from '../../api/model/PasteListView';
import AppContext from '../../AppContext';
import {relativeDiffLabel, toDateTimeString} from '../../datetime/DateTimeUtil';
import {Lock, Infinity} from '../../assets/Vectors';
import styles from './recentPastes.module.css';

const RecentPastes: () => JSX.Element = () => {

  const [pastes, { mutate, refetch }] = createResource(ApiClient.findAll);

  onMount(() => {
    startSchedule();

    AppContext.onPasteCreated((paste) => {
      const newItem: PasteListView = {
        id: paste.id,
        title: paste.title,
        dateCreated: paste.dateCreated,
        dateOfExpiry: paste.dateOfExpiry,
        isEncrypted: paste.isEncrypted,
        sizeInBytes: paste.sizeInBytes
      };

      restartSchedule();
      mutate(prev => [newItem].concat(prev))
    });

    AppContext.onPasteDeleted((paste) => {
      restartSchedule();
      mutate(prev => prev.filter(item => item.id !== paste.id));
    });
  })

  onCleanup(() => stopSchedule());

  let refetchSchedule;

  function manualRefetch() {
    restartSchedule();
    refetch();
  }

  function startSchedule() {
    refetchSchedule = window.setInterval(refetch, 60_000);
  }

  function stopSchedule() {
    window.clearInterval(refetchSchedule);
  }

  function restartSchedule() {
    stopSchedule();
    startSchedule();
  }

  return (
    <div class={styles.recentPastes}>

      <Switch>
        <Match when={pastes.error}>
          <h3>Loading ..</h3>
        </Match>
        <Match when={pastes.latest}>
          <h3>
            <strong>
              <Show when={pastes()?.length} keyed fallback={"Nothing pasted yet"}>
              Last {pastes()?.length} pastes
              </Show>
            </strong>
            &nbsp;
            <span class={styles.refetch} onClick={manualRefetch}>↻</span>
          </h3>

          <A class={styles.searchLink} activeClass={styles.searchLinkActive} href={'/paste/search'}>Search all pastes</A>

          <ol>
            <For each={pastes()}>{item =>
            <li class={styles.item}>
              <p><A href={'/paste/' + item.id}>{item.title || 'Untitled' }</A> <Show when={!item.dateOfExpiry} keyed><span title="Permanent"><Infinity/></span></Show> <Show when={item.isEncrypted} keyed><span title="Encrypted"><Lock/></span></Show></p>
              <p>Created: <time title={toDateTimeString(item.dateCreated)}>{relativeDiffLabel(item.dateCreated)}</time> | Size: {item.sizeInBytes} bytes</p>
            </li>
            }
            </For>
          </ol>
        </Match>
      </Switch>
    </div>
  )
}

export default RecentPastes
