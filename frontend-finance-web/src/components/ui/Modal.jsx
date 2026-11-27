import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { gsap } from "gsap";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  footer = null,
}) => {
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let ctx;
    if (!prefersReducedMotion && overlayRef.current && modalRef.current) {
      ctx = gsap.context(() => {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.96, y: 12 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.22,
            ease: "power2.out",
            clearProps: "transform",
          }
        );
      });
    }

    modalRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow || "";
      ctx?.revert();
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === overlayRef.current && onClose) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xl focus:outline-none dark:border-gray-800 dark:bg-gray-900 ${
          sizes[size] || sizes.md
        } ${className}`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200/90 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
          <h3
            id={titleId}
            className="truncate pr-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {title}
          </h3>
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-200/90 bg-gray-50/70 px-5 py-4 dark:border-gray-800 dark:bg-gray-900/90 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;