import React, {
  ButtonHTMLAttributes,
  ComponentType,
  MouseEvent,
  forwardRef,
  FocusEvent,
  KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  HTMLAttributes,
} from "react";
import styled from "@emotion/styled";
import useForkRef from "./utils/useForkRef";
import useEventCallback from "./utils/useEventCallback";
import useIsFocusVisible from "./utils/useIsFocusVisible";
import TouchRipple, { TouchRippleProps } from "./TouchRipple";

type ButtonBaseProps = HTMLAttributes<HTMLElement> & {
  /**
   * A ref for imperative actions.
   * It currently only supports `focusVisible()` action.
   */
  action?: React.Ref<{
    focusVisible(): void;
  }>;
  /**
   * @ignore
   *
   * Use that prop to pass a ref to the native button component.
   * @deprecated Use `ref` instead.
   */
  buttonRef?: React.Ref<unknown>;
  /**
   * If `true`, the ripples are centered.
   * They won't start at the cursor interaction position.
   * @default false
   */
  centerRipple?: boolean;
  /**
   * The content of the component.
   */
  children?: React.ReactNode;
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: {
    /** Styles applied to the root element. */
    root?: string;
    /** Pseudo-class applied to the root element if `disabled={true}`. */
    disabled?: string;
    /** Pseudo-class applied to the root element if keyboard focused. */
    focusVisible?: string;
  };
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.focusedVisible` class.
   * @default false
   */
  disableRipple?: boolean;
  /**
   * If `true`, the touch ripple effect is disabled.
   * @default false
   */
  disableTouchRipple?: boolean;
  /**
   * If `true`, the base button will have a keyboard focus ripple.
   * @default true
   */
  focusRipple?: boolean;
  /**
   * This prop can help identify which element has keyboard focus.
   * The class name will be applied when the element gains the focus through keyboard interaction.
   * It's a polyfill for the [CSS :focus-visible selector](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo).
   * The rationale for using this feature [is explained here](https://github.com/WICG/focus-visible/blob/master/explainer.md).
   * A [polyfill can be used](https://github.com/WICG/focus-visible) to apply a `focus-visible` class to other components
   * if needed.
   */
  focusVisibleClassName?: string;
  /**
   * The component used to render a link when the `href` prop is provided.
   * @default 'a'
   */
  LinkComponent?: React.ElementType;
  /**
   * Callback fired when the component is focused with a keyboard.
   * We trigger a `onFocus` callback too.
   */
  onFocusVisible?: React.FocusEventHandler<any>;
  /**
   * @default 0
   */
  tabIndex?: string | number;
  /**
   * Props applied to the `TouchRipple` element.
   */
  TouchRippleProps?: Partial<TouchRippleProps>;

  [K: string]: any;
};

export const ButtonBaseRoot = styled("button")({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  backgroundColor: "transparent", // Reset default value
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  border: 0,
  margin: 0, // Remove the margin in Safari
  borderRadius: 0,
  padding: 0, // Remove the padding in Firefox
  cursor: "pointer",
  userSelect: "none",
  verticalAlign: "middle",
  MozAppearance: "none", // Reset
  WebkitAppearance: "none", // Reset
  textDecoration: "none",
  // So we take precedent over the style of a native <a /> element.
  color: "inherit",
  "&::-moz-focus-inner": {
    borderStyle: "none", // Remove Firefox dotted outline.
  },
  "&.disabled": {
    pointerEvents: "none", // Disable link interactions
    cursor: "default",
  },
  "@media print": {
    colorAdjust: "exact",
  },
});

/**
 * `ButtonBase` contains as few styles as possible.
 * It aims to be a simple building block for creating a button.
 * It contains a load of style reset and some focus/ripple logic.
 */
const ButtonBase: ComponentType<ButtonBaseProps> = forwardRef(
  function ButtonBase(props, ref) {
    const {
      action,
      buttonRef: buttonRefProp,
      centerRipple = false,
      children,
      className,
      component = "button",
      disabled = false,
      disableRipple = false,
      disableTouchRipple = false,
      focusRipple = true,
      focusVisibleClassName,
      LinkComponent = "a",
      onBlur,
      onClick,
      onContextMenu,
      onDragLeave,
      onFocus,
      onFocusVisible,
      onKeyDown,
      onKeyUp,
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onTouchEnd,
      onTouchMove,
      onTouchStart,
      tabIndex = 0,
      TouchRippleProps,
      type,
      ...other
    } = props;

    const buttonRef = useRef(null);
    const rippleRef = useRef(null);

    const {
      isFocusVisibleRef,
      onFocus: handleFocusVisible,
      onBlur: handleBlurVisible,
      ref: focusVisibleRef,
    } = useIsFocusVisible();
    const [focusVisible, setFocusVisible] = useState(false);
    if (disabled && focusVisible) {
      setFocusVisible(false);
    }
    useEffect(() => {
      isFocusVisibleRef.current = focusVisible;
    }, [focusVisible, isFocusVisibleRef]);

    useImperativeHandle(
      action,
      () => ({
        focusVisible: () => {
          setFocusVisible(true);
          buttonRef.current.focus();
        },
      }),
      []
    );

    useEffect(() => {
      if (focusVisible && focusRipple && !disableRipple) {
        rippleRef.current.pulsate();
      }
    }, [disableRipple, focusRipple, focusVisible]);

    function useRippleHandler<T>(
      rippleAction: any,
      eventCallback: (event: T) => void,
      skipRippleAction = disableTouchRipple
    ) {
      return useEventCallback((event: any) => {
        if (eventCallback) {
          eventCallback(event);
        }

        if (!skipRippleAction && rippleRef.current) {
          rippleRef.current[rippleAction](event);
        }

        return true;
      });
    }

    const handleMouseDown = useRippleHandler("start", onMouseDown);
    const handleContextMenu = useRippleHandler("stop", onContextMenu);
    const handleDragLeave = useRippleHandler("stop", onDragLeave);
    const handleMouseUp = useRippleHandler("stop", onMouseUp);
    const handleMouseLeave = useRippleHandler(
      "stop",
      (event: MouseEvent<HTMLElement>) => {
        if (focusVisible) {
          event.preventDefault();
        }
        if (onMouseLeave) {
          onMouseLeave(event);
        }
      }
    );
    const handleTouchStart = useRippleHandler("start", onTouchStart);
    const handleTouchEnd = useRippleHandler("stop", onTouchEnd);
    const handleTouchMove = useRippleHandler("stop", onTouchMove);

    const handleBlur = useRippleHandler(
      "stop",
      (event: FocusEvent<HTMLElement>) => {
        handleBlurVisible(event);
        if (isFocusVisibleRef.current === false) {
          setFocusVisible(false);
        }
        if (onBlur) {
          onBlur(event);
        }
      },
      false
    );

    const handleFocus = useEventCallback((event: FocusEvent<HTMLElement>) => {
      if (!buttonRef.current) {
        buttonRef.current = event.currentTarget;
      }

      handleFocusVisible(event);
      if (isFocusVisibleRef.current === true) {
        setFocusVisible(true);

        if (onFocusVisible) {
          onFocusVisible(event);
        }
      }

      if (onFocus) {
        onFocus(event);
      }
    });

    const isNonNativeButton = () => {
      const button = buttonRef.current;
      return (
        component &&
        component !== "button" &&
        !(button.tagName === "A" && button.href)
      );
    };

    const keydownRef = useRef(false);
    const handleKeyDown = useEventCallback(
      (event: KeyboardEvent<HTMLElement>) => {
        // Check if key is already down to avoid repeats being counted as multiple activations
        if (
          focusRipple &&
          !keydownRef.current &&
          focusVisible &&
          rippleRef.current &&
          event.key === " "
        ) {
          keydownRef.current = true;
          event.persist();
          rippleRef.current.stop(event, () => {
            rippleRef.current.start(event);
          });
        }

        if (
          event.target === event.currentTarget &&
          isNonNativeButton() &&
          event.key === " "
        ) {
          event.preventDefault();
        }

        if (onKeyDown) {
          onKeyDown(event);
        }

        // Keyboard accessibility for non interactive elements
        if (
          event.target === event.currentTarget &&
          isNonNativeButton() &&
          event.key === "Enter" &&
          !disabled
        ) {
          event.preventDefault();
          if (onClick) {
            onClick(event as any);
          }
        }
      }
    );

    const handleKeyUp = useEventCallback(
      (event: KeyboardEvent<HTMLElement>) => {
        if (
          focusRipple &&
          event.key === " " &&
          rippleRef.current &&
          focusVisible &&
          !event.defaultPrevented
        ) {
          keydownRef.current = false;
          event.persist();
          rippleRef.current.stop(event, () => {
            rippleRef.current.pulsate(event);
          });
        }
        if (onKeyUp) {
          onKeyUp(event);
        }

        // Keyboard accessibility for non interactive elements
        if (
          onClick &&
          event.target === event.currentTarget &&
          isNonNativeButton() &&
          event.key === " " &&
          !event.defaultPrevented
        ) {
          onClick(event as any);
        }
      }
    );

    let ComponentProp = component;

    if (ComponentProp === "button" && other.href) {
      ComponentProp = LinkComponent;
    }

    const buttonProps: ButtonHTMLAttributes<HTMLButtonElement> = {};
    if (ComponentProp === "button") {
      buttonProps.type = type === undefined ? "button" : type;
      buttonProps.disabled = disabled;
    } else {
      if (ComponentProp !== "a" || !other.href) {
        buttonProps.role = "button";
      }
      buttonProps["aria-disabled"] = disabled;
    }

    const handleUserRef = useForkRef(buttonRefProp, ref);
    const handleOwnRef = useForkRef(focusVisibleRef, buttonRef);
    const handleRef = useForkRef(handleUserRef, handleOwnRef);

    const [mountedState, setMountedState] = useState(false);

    useEffect(() => {
      setMountedState(true);
    }, []);

    const enableTouchRipple = mountedState && !disableRipple && !disabled;

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useEffect(() => {
        if (enableTouchRipple && !rippleRef.current) {
          console.error(
            [
              "The `component` prop provided to ButtonBase is invalid.",
              "Please make sure the children prop is rendered in this custom component.",
            ].join("\n")
          );
        }
      }, [enableTouchRipple]);
    }

    return (
      <ButtonBaseRoot
        as={ComponentProp}
        className={className}
        onBlur={handleBlur}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onDragLeave={handleDragLeave}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={handleRef}
        tabIndex={disabled ? -1 : (tabIndex as number)}
        type={type}
        {...buttonProps}
        {...other}
      >
        {children}
        {enableTouchRipple ? (
          <TouchRipple
            ref={rippleRef}
            center={centerRipple}
            {...TouchRippleProps}
          />
        ) : null}
      </ButtonBaseRoot>
    );
  }
);

export default ButtonBase;
