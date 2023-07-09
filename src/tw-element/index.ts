import { LitElement, unsafeCSS } from "lit";
import styles from "./index.css?inline";
import { contextEvents } from "../twitch";
import { property } from "lit/decorators.js";

export const twStyles = unsafeCSS(styles);

export class TwElement extends LitElement {
  static styles = twStyles;

  @property({ reflect: true })
  darktheme = contextEvents.get()?.theme === "dark" || false;

  private unsubscribeContext?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribeContext = contextEvents.subscribe((v) => {
      v.theme !== undefined && (this.darktheme = v?.theme === "dark");
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeContext?.();
  }
}
