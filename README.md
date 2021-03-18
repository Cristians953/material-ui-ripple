<h1 align="center">Material UI Ripple</h1>

<p align="center">
    Material UI Ripple is a library with core components extracted from <a href="https://github.com/mui-org/material-ui">material-ui</a> library.
</p>

## Installation

To install the latest version of the library run the following command:

```sh
npm i material-ui-ripple
```

## Usage

The library exports 3 core component - Ripple, TouchRipple and ButtonBase,

The simplest way is to use `ButtonBase` component,
it contains a load of style reset, and some focus/ripple logic.

Example:

```jsx
import { ButtonBase } from 'material-ui-ripple';

function MaterialButton() {
  return (
    <ButtonBase className='my-button'>
      Some Text
    </ButtonBase>
  )
}    
```

Full documentation of component and prop types you can
see on the <a href="https://material-ui.com/api/button-base/#buttonbase-api">official page</a>.


If you want to customize the ripple effect logic you can
use the `TouchRipple` component, from which you can access
the ripple API through the ref.

Example:

```jsx
import { useRef } from 'react';
import { TouchRipple } from 'material-ui-ripple';

function MaterialButton() {
  const rippleRef = useRef(null);
  
  function handleClick() {
    // There are 3 methods by which you can
    // manage the state of the ripple effect
    rippleRef.current.pulsate();
    rippleRef.current.stop();
    rippleRef.current.start();
  }
  
  return (
    <button onClick={handleClick}>
      Some Text
      <TouchRipple />
    </button>
  )
}
```
