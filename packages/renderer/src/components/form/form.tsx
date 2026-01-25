import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import type { FieldValues, FormProviderProps } from "react-hook-form";
import { FormProvider } from "react-hook-form";

import { cn } from "../../lib/utils.js";

const Form = <TFieldValues extends FieldValues>({
  children,
  ...formProps
}: FormProviderProps<TFieldValues> & { children: ReactNode }) => (
  <FormProvider {...formProps}>{children}</FormProvider>
);

type FormItemProps = HTMLAttributes<HTMLDivElement>;

const FormItem = ({ className, ...props }: FormItemProps) => (
  <div className={cn("space-y-2", className)} {...props} />
);

const FormLabel = (props: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      "text-sm font-semibold text-foreground",
      props.className ?? "",
    )}
    {...props}
  />
);

const FormDescription = (props: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted", props.className ?? "")} {...props} />
);

const FormMessage = (props: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    role="alert"
    className={cn("text-sm font-semibold text-danger", props.className ?? "")}
    {...props}
  />
);

export { Form, FormDescription, FormItem, FormLabel, FormMessage };
