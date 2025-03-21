import {Component, createSignal, JSX, onMount, onCleanup} from "solid-js";
import {createStore} from "solid-js/store";
import {PasteCreateCmd} from "../../api/model/PasteCreateCmd";
import {encrypt} from "../../crypto/CryptoUtil";
import {CopyToClipboard} from "../../assets/Vectors";
import {PasteClone} from "../../src/AppContext";
import styles from "./createPaste.module.css";

type CreatePasteProps = {
  onCreatePaste: (paste: PasteCreateCmd) => Promise<void>
  initialPaste?: PasteClone
}

type FormModel = {
  title?: string
  content: string
  expiry?: 'ONE_HOUR' | 'ONE_DAY' | 'ONE_WEEK' | 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR' | 'NEVER'
  exposure?: 'PUBLIC' | 'UNLISTED' | 'ONCE'
  password?: string
}

const CreatePaste: Component<CreatePasteProps> = ({onCreatePaste, initialPaste}): JSX.Element => {

  const [form, setForm] = createStore<FormModel>({
    title: initialPaste?.title || null,
    content: initialPaste?.content || null,
    expiry: null,
    exposure: null,
    password: null,
  });

  const [lastPasteUrl, setLastPasteUrl] = createSignal<string>();

  let creationForm: HTMLFormElement
  let submitInput: HTMLInputElement

  onMount(() => {
    window.addEventListener("keydown", globalSubmitPaste);
  })

  onCleanup(() => {
    window.removeEventListener("keydown", globalSubmitPaste);
  })

  function globalSubmitPaste(e: KeyboardEvent) {
    if (e.altKey || e.shiftKey) {
      return;
    }

    if (e.code === 'Enter' && ((e.ctrlKey || e.metaKey) && e.ctrlKey !== e.metaKey)) { // XOR
      creationForm.requestSubmit();
    }
  }

  function updateFormField(fieldName: keyof FormModel): (event: Event) => void {
    return (event: Event) => {
        const inputElement = event.currentTarget as HTMLInputElement;

        setForm({
          [fieldName]: inputElement.value
        });
    }
  }

  function resetCreatePaste() {
    setForm({
          title: null,
          password: null,
          content: null,
          expiry: null,
          exposure: null
        } as FormModel)

    submitInput.style.backgroundColor = "";
  }

  function resetCreateForm() {
    creationForm?.reset();
  }

  function createPaste(e: Event) {
    e.preventDefault();

    if (form.content?.length < 5) {
      return;
    }

    const data: PasteCreateCmd = {
      ...(form.title && { title: form.title }),
      ...(form.content && { content: form.content }),
      ...(form.expiry && { expiry: form.expiry }),
      ...(form.exposure && { exposure: form.exposure })
    }

    if (form.password) {
      data.content = encrypt(data.content, form.password);
      data.isEncrypted = true;
    }

    onCreatePaste(data)
      .catch(() => submitInput.style.backgroundColor = 'red');
  }

  return (
    <form ref={creationForm} onSubmit={createPaste} onReset={resetCreatePaste} autocomplete="off" class={styles.createForm}>
      <fieldset>
        <div>
          <label for="expiry">Expires in: </label>
          <select id="expiry" name="expiry" onChange={updateFormField("expiry")}>
            <option value="ONE_HOUR">1 Hour</option>
            <option value="ONE_DAY" selected>1 Day</option>
            <option value="ONE_WEEK">1 Week</option>
            <option value="ONE_MONTH">1 Month</option>
            <option value="THREE_MONTHS">3 Months</option>
            <option value="ONE_YEAR">1 Year</option>
            <option value="NEVER">Never</option>
          </select>
        </div>
        <hr/>
        <div>
          <label>Visibility: </label>
          <label for="public">
            <input type="radio" id="public" name="exposure" value="PUBLIC" checked
                   onInput={updateFormField("exposure")}/>
            Public
          </label>
          <label for="unlisted">
            <input type="radio" id="unlisted" name="exposure" value="UNLISTED" onInput={updateFormField("exposure")}/>
            Unlisted
          </label>
          <label for="once">
            <input type="radio" id="once" name="exposure" value="ONCE" onInput={updateFormField("exposure")}/>
            Once (One&#8209;Time)
          </label>
        </div>
        <hr/>
        <div>
          <label for="title">Title (optional): </label>
          <input type="text"
                 id="title"
                 name="title"
                 placeholder="Title"
                 maxLength={255}
                 value={form.title}
                 onInput={updateFormField("title")}/>
        </div>
        <hr/>
        <div>
          <label for="key">Password (optional): </label>
          <input id="key"
                 name="key"
                 type="password"
                 placeholder="Password"
                 autocomplete="one-time-code"
                 onInput={updateFormField("password")}/>
        </div>
        <hr/>
        <div class={styles.content}>
          <textarea minlength="5"
                    maxlength="4096"
                    required
                    autofocus
                    rows="20"
                    cols="50"
                    placeholder="Paste here"
                    name="content"
                    onInput={updateFormField("content")}>{form.content}</textarea>
          <span>{form.content?.length || 0} / 4096</span>
        </div>
      </fieldset>

      <fieldset>
        <input ref={submitInput} type="submit" value="Paste"/>
        <input type="reset" value="Reset"/>
      </fieldset>

    </form>
  )
};

export default CreatePaste;
