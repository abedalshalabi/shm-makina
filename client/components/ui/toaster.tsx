import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, image, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl border border-gray-100 object-cover bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <ToastIcon variant={props.variant} />
              )}
              <div className="grid min-w-0 gap-1 pt-1 text-right">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
