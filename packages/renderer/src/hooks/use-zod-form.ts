import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { infer as zInfer, ZodTypeAny } from "zod";

const useZodForm = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  options?: UseFormProps<zInfer<TSchema>>,
): UseFormReturn<zInfer<TSchema>> =>
  useForm<zInfer<TSchema>>({
    resolver: zodResolver(schema),
    ...(options ?? {}),
  });

export default useZodForm;
