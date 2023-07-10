import { ReactiveController, ReactiveControllerHost } from "lit";

export function createEmitter<T>() {
  const subscriptions = new Set<(v: T) => unknown>();

  return {
    emit(v: T) {
      subscriptions.forEach((cb) => cb(v));
    },

    subscribe(cb: (v: T) => unknown) {
      subscriptions.add(cb);

      return () => {
        subscriptions.delete(cb);
      };
    },
  };
}

export function createCachedEmitter<T>() {
  const emitter = createEmitter<T>();
  let cachedValue: { received: false } | { received: true; value: T } = { received: false };

  return {
    get() {
      return cachedValue.received ? cachedValue.value : undefined;
    },

    subscribe(cb: (v: T) => unknown) {
      cachedValue.received && cb(cachedValue.value);
      return emitter.subscribe(cb);
    },

    emit(v: T) {
      cachedValue = { received: true, value: v };
      emitter.emit(v);
    },
  };
}

export class EmitterController<T> implements ReactiveController {
  private unsubscribeCallback?: () => void;

  constructor(
    private host: ReactiveControllerHost,
    private emitter: ReturnType<typeof createEmitter<T>>,
    private onEvent: (v: T) => unknown,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.unsubscribeCallback?.();
    this.unsubscribeCallback = this.emitter.subscribe((v) => {
      this.onEvent(v);
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.unsubscribeCallback?.();
    this.unsubscribeCallback = undefined;
  }
}

export class CachedEmitterController<T> implements ReactiveController {
  private emittingController: EmitterController<T>;

  value?: T;

  constructor(host: ReactiveControllerHost, emitter: ReturnType<typeof createCachedEmitter<T>>) {
    this.emittingController = new EmitterController(host, emitter, (v) => this.handleEvent(v));
    this.value = emitter.get();
  }

  hostConnected() {
    this.emittingController.hostConnected();
  }

  hostDisconnected() {
    this.emittingController.hostDisconnected();
  }

  private handleEvent(v: T) {
    this.value = v;
  }
}
