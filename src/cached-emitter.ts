import { ReactiveController, ReactiveControllerHost } from "lit";

export function createCachedEmitter<T>() {
  const subscriptions = new Set<(v: T) => unknown>();
  let cachedValue: { received: false } | { received: true; value: T } = { received: false };

  return {
    get() {
      return cachedValue.received ? cachedValue.value : undefined;
    },

    subscribe(cb: (v: T) => unknown) {
      subscriptions.add(cb);
      cachedValue.received && cb(cachedValue.value);

      return () => {
        subscriptions.delete(cb);
      };
    },

    set(v: T) {
      cachedValue = { received: true, value: v };
      subscriptions.forEach((cb) => cb(v));
    },
  };
}

export class CachedEmitterController<T> implements ReactiveController {
  host: ReactiveControllerHost;

  private emitter: ReturnType<typeof createCachedEmitter<T>>;
  private unsubscribeCallback?: () => void;

  value?: T;

  constructor(host: ReactiveControllerHost, emitter: ReturnType<typeof createCachedEmitter<T>>) {
    (this.host = host).addController(this);
    this.emitter = emitter;
    this.value = this.emitter.get();
  }

  hostConnected() {
    this.unsubscribeCallback = this.emitter.subscribe((v) => {
      this.value = v;
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.unsubscribeCallback?.();
  }
}
