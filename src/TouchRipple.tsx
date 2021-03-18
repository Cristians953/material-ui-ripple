import React, {
  forwardRef,
  HTMLAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { TransitionGroup } from "react-transition-group";
import clsx from "clsx";

import Ripple from "./Ripple";

const DURATION = 550;
export const DELAY_RIPPLE = 80;

const touchRippleClasses = {
  root: "root",
  ripple: "ripple",
  rippleVisible: "rippleVisible",
  ripplePulsate: "ripplePulsate",
  child: "child",
  childLeaving: "childLeaving",
  childPulsate: "childPulsate",
};

const enterKeyframe = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`;

const exitKeyframe = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const pulsateKeyframe = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }
`;

const TouchRippleRoot = styled("span")({
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: "inherit",
});

export const TouchRippleRipple = styled(Ripple, {})`
  opacity: 0;
  position: absolute;
  &.${touchRippleClasses.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${enterKeyframe};
    animation-duration: ${DURATION}ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  &.${touchRippleClasses.ripplePulsate} {
    animation-duration: 200ms;
  }
  & .${touchRippleClasses.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }
  & .${touchRippleClasses.childLeaving} {
    opacity: 0;
    animation-name: ${exitKeyframe};
    animation-duration: ${DURATION}ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  & .${touchRippleClasses.childPulsate} {
    position: absolute;
    left: 0;
    top: 0;
    animation-name: ${pulsateKeyframe};
    animation-duration: 2500ms;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`;

export type TouchRippleProps = HTMLAttributes<HTMLElement> & {
  center?: boolean;
  classes?: Record<keyof typeof touchRippleClasses, string>;
};

export type TouchRippleHandle = {
  pulsate(): void;
  start(
    event: any,
    options?: { pulsate?: boolean; center?: boolean },
    cb?: () => void
  ): void;
  stop(event: any, cb?: () => void): void;
};

const TouchRipple = forwardRef<TouchRippleHandle, TouchRippleProps>(
  function TouchRipple(props, ref) {
    const {
      center: centerProp = false,
      classes = {} as Record<keyof typeof touchRippleClasses, string>,
      className,
      ...other
    } = props;

    const [ripples, setRipples] = useState([]);
    const nextKey = useRef(0);
    const rippleCallback = useRef(null);

    useEffect(() => {
      if (rippleCallback.current) {
        rippleCallback.current();
        rippleCallback.current = null;
      }
    }, [ripples]);

    // Used to filter out mouse emulated events on mobile.
    const ignoringMouseDown = useRef(false);
    // We use a timer in order to only show the ripples for touch "click" like events.
    // We don't want to display the ripple for touch scroll events.
    const startTimer = useRef(null);

    // This is the hook called once the previous timeout is ready.
    const startTimerCommit = useRef(null);
    const container = useRef(null);

    useEffect(() => {
      return () => {
        clearTimeout(startTimer.current);
      };
    }, []);

    const startCommit = useCallback(
      (params) => {
        const { pulsate, rippleX, rippleY, rippleSize, cb } = params;

        setRipples((oldRipples) => [
          ...oldRipples,
          <TouchRippleRipple
            key={nextKey.current}
            classes={{
              ripple: clsx(classes.ripple, touchRippleClasses.ripple),
              rippleVisible: clsx(
                classes.rippleVisible,
                touchRippleClasses.rippleVisible
              ),
              ripplePulsate: clsx(
                classes.ripplePulsate,
                touchRippleClasses.ripplePulsate
              ),
              child: clsx(classes.child, touchRippleClasses.child),
              childLeaving: clsx(
                classes.childLeaving,
                touchRippleClasses.childLeaving
              ),
              childPulsate: clsx(
                classes.childPulsate,
                touchRippleClasses.childPulsate
              ),
            }}
            timeout={DURATION}
            pulsate={pulsate}
            rippleX={rippleX}
            rippleY={rippleY}
            rippleSize={rippleSize}
          />,
        ]);
        nextKey.current += 1;
        rippleCallback.current = cb;
      },
      [classes]
    );

    const start = useCallback(
      (event = {}, options = {}, cb?: () => void) => {
        const {
          pulsate = false,
          center = centerProp || options.pulsate,
          fakeElement = false, // For test purposes
        } = options;

        if (event.type === "mousedown" && ignoringMouseDown.current) {
          ignoringMouseDown.current = false;
          return;
        }

        if (event.type === "touchstart") {
          ignoringMouseDown.current = true;
        }

        const element = fakeElement ? null : container.current;
        const rect = element
          ? element.getBoundingClientRect()
          : {
              width: 0,
              height: 0,
              left: 0,
              top: 0,
            };

        // Get the size of the ripple
        let rippleX: number;
        let rippleY: number;
        let rippleSize: number;

        if (
          center ||
          (event.clientX === 0 && event.clientY === 0) ||
          (!event.clientX && !event.touches)
        ) {
          rippleX = Math.round(rect.width / 2);
          rippleY = Math.round(rect.height / 2);
        } else {
          const { clientX, clientY } = event.touches ? event.touches[0] : event;
          rippleX = Math.round(clientX - rect.left);
          rippleY = Math.round(clientY - rect.top);
        }

        if (center) {
          rippleSize = Math.sqrt((2 * rect.width ** 2 + rect.height ** 2) / 3);

          // For some reason the animation is broken on Mobile Chrome if the size if even.
          if (rippleSize % 2 === 0) {
            rippleSize += 1;
          }
        } else {
          const sizeX =
            Math.max(
              Math.abs((element ? element.clientWidth : 0) - rippleX),
              rippleX
            ) *
              2 +
            2;
          const sizeY =
            Math.max(
              Math.abs((element ? element.clientHeight : 0) - rippleY),
              rippleY
            ) *
              2 +
            2;
          rippleSize = Math.sqrt(sizeX ** 2 + sizeY ** 2);
        }

        // Touche devices
        if (event.touches) {
          // check that this isn't another touchstart due to multitouch
          // otherwise we will only clear a single timer when unmounting while two
          // are running
          if (startTimerCommit.current === null) {
            // Prepare the ripple effect.
            startTimerCommit.current = () => {
              startCommit({ pulsate, rippleX, rippleY, rippleSize, cb });
            };
            // Delay the execution of the ripple effect.
            startTimer.current = setTimeout(() => {
              if (startTimerCommit.current) {
                startTimerCommit.current();
                startTimerCommit.current = null;
              }
            }, DELAY_RIPPLE); // We have to make a tradeoff with this value.
          }
        } else {
          startCommit({ pulsate, rippleX, rippleY, rippleSize, cb });
        }
      },
      [centerProp, startCommit]
    );

    const pulsate = useCallback(() => {
      start({}, { pulsate: true });
    }, [start]);

    const stop = useCallback((event, cb) => {
      clearTimeout(startTimer.current);

      // The touch interaction occurs too quickly.
      // We still want to show ripple effect.
      if (event.type === "touchend" && startTimerCommit.current) {
        event.persist();
        startTimerCommit.current();
        startTimerCommit.current = null;
        startTimer.current = setTimeout(() => {
          stop(event, cb);
        });
        return;
      }

      startTimerCommit.current = null;

      setRipples((oldRipples) => {
        if (oldRipples.length > 0) {
          return oldRipples.slice(1);
        }
        return oldRipples;
      });
      rippleCallback.current = cb;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        pulsate,
        start,
        stop,
      }),
      [pulsate, start, stop]
    );

    return (
      <TouchRippleRoot
        className={clsx(classes.root, touchRippleClasses.root, className)}
        ref={container}
        {...other}
      >
        <TransitionGroup component={null} exit>
          {ripples}
        </TransitionGroup>
      </TouchRippleRoot>
    );
  }
);

export default TouchRipple;
