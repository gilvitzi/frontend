import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item-body";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";
import "@polymer/paper-input/paper-input";
import {
  css,
  customElement,
  html,
  LitElement,
  property,
  TemplateResult,
} from "lit-element";
import { fireEvent } from "../common/dom/fire_event";
import { getAllIconNames } from "../data/iconsets";
import "./ha-icon";

@customElement("ha-icon-input")
export class HaIconInput extends LitElement {
  @property() public value?: string;

  @property() public label?: string;

  @property() public placeholder?: string;

  @property({ type: Number }) public maxSuggestions: number = 10;

  @property({ attribute: "error-message" }) public errorMessage?: string;

  @property({ type: Boolean }) public disabled = false;

  allAvailableIcons: string[];
  suggestions: string[];
  suggestionsVisible: boolean;
  suggestionMouseDown: boolean;
  skipShowSuggestions: boolean;

  constructor() {
    super();
    this.allAvailableIcons = [];
    this.suggestions = [];
    this.suggestionsVisible = false;
    this.suggestionMouseDown = false;
    this.skipShowSuggestions = false;

    getAllIconNames().then((items) => {
      items.forEach((item) =>
        this.allAvailableIcons.push(item[0] + ":" + item[1])
      );
      console.log(`loaded ${this.allAvailableIcons.length} icon options`);
    });
  }

  protected render(): TemplateResult {
    return html`
      <div>
        <paper-input
          .value=${this.value}
          .label=${this.label}
          .placeholder=${this.placeholder}
          @value-changed=${this._inputValueChanged}
          .disabled=${this.disabled}
          auto-validate
          .errorMessage=${this.errorMessage}
          pattern="^\\S+:\\S+$"
          @blur="${this._onSuggestionsListBlur}}"
        >
          ${this.value || this.placeholder
            ? html`
                <ha-icon .icon=${this.value || this.placeholder} slot="suffix">
                </ha-icon>
              `
            : ""}
        </paper-input>

        <paper-listbox
          class="suggestions-list ${this.suggestionsVisible ? "" : "hidden"}"
          slot="dropdown-content"
          role="listbox"
          @selected-item-changed=${() => console.log("changed")}
        >
          ${this.suggestions &&
          this.suggestions.map((item) => {
            return html` <paper-item
              class="suggestion-item"
              @mousedown=${this._onSuggestionMouseDown}
              @mouseup=${this._onSuggestionMouseUp}
              @click=${() => this._handleSuggestionClicked(item)}
              role="option"
            >
              <ha-icon .icon=${item} class="suggestion-icon"></ha-icon>
              <span>${item}</span>
            </paper-item>`;
          })}
        </paper-listbox>
      </div>
    `;
  }

  private _fireValueChangedEvent() {
    fireEvent(
      this,
      "value-changed",
      { value: this.value },
      {
        bubbles: false,
        composed: false,
      }
    );
  }

  private _inputValueChanged(ev: CustomEvent) {
    console.log("_inputValueChanged");

    this._updateValue(ev.detail.value);

    if (this.skipShowSuggestions) {
      this.skipShowSuggestions = false;
    } else {
      this._showSuggestions();
    }
  }

  private _handleSuggestionClicked(value: string) {
    console.log("_handleSuggestionClicked");
    this._hideSuggestions();
    this.skipShowSuggestions = true;
    this._updateValue(value);
    this._fireValueChangedEvent();
  }

  private _updateValue(value: string) {
    console.log("_updateValue");
    this.value = value;
    this._updateSuggestions(this.value);
  }

  static get styles() {
    return css`
      ha-icon {
        position: absolute;
        bottom: 2px;
        right: 0;
      }

      paper-listbox.suggestions-list {
        /* make the list appear as floating like in the case of paper-dropdown-menu */
        box-shadow: var(--shadow-elevation-2dp_-_box-shadow);
      }

      paper-listbox.suggestions-list.hidden {
        display: none;
      }

      paper-item.suggestion-item {
        cursor: pointer;
      }

      paper-item.suggestion-item.iron-selected {
        /* ignore selected items in listbox */
        font-weight: normal;
      }

      paper-item.suggestion-item .suggestion-icon {
        bottom: 13px;
        right: 5px;
      }
    `;
  }

  private _updateSuggestions(value: string | undefined) {
    let matches: Set<string>;
    let startMatch = this.allAvailableIcons
      .filter((name) => name.startsWith(value || ""))
      .slice(0, this.maxSuggestions);

    matches = new Set<string>(startMatch);

    if (value && matches.size < this.maxSuggestions) {
      // search for the string also in the middle
      let middleMatches = this.allAvailableIcons
        .filter((name) => name.indexOf(value) > -1)
        .slice(0, this.maxSuggestions - matches.size);

      middleMatches.forEach((item) => {
        matches.add(item);
      });
    }

    this.suggestions = Array.from(matches);
  }

  private _onSuggestionMouseDown() {
    this.suggestionMouseDown = true;
  }

  private _onSuggestionMouseUp() {
    this.suggestionMouseDown = false;
  }

  private _onSuggestionsListBlur() {
    console.log(
      `_onSuggestionsListBlur this.suggestionMouseDown: ${this.suggestionMouseDown}`
    );
    //check if we didn't lose focus because a suggestion-item was clicked
    if (this.suggestionMouseDown) return;

    this._hideSuggestions();
  }

  private _hideSuggestions() {
    console.log("_hideSuggestions");
    this.suggestionsVisible = false;
    this.requestUpdate().then((success) =>
      console.log("result from _hideSuggestions: " + success)
    );
  }

  private _showSuggestions() {
    console.log("_showSuggestions");
    this.suggestionsVisible = !!this.suggestions.length;
    this.requestUpdate().then((success) =>
      console.log("result from _showSuggestions: " + success)
    );
  }
}
