import "@polymer/paper-input/paper-input";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import "../../../../components/ha-icon-input";

class HaCustomizeIcon extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          @apply --layout-horizontal;
        }
      </style>
      <ha-icon-input
        value="[[item.value]]"
        disabled="[[item.secondary]]"
        placeholder="mdi:home"
        label="Icon"
      ></ha-icon-input>
    `;
  }

  static get properties() {
    return {
      item: {
        type: Object,
        notifies: true,
      },
    };
  }
}
customElements.define("ha-customize-icon", HaCustomizeIcon);
