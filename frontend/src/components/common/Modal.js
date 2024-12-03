import React from 'react';

const Modal = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

export default Modal;
