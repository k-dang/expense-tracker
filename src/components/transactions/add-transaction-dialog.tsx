"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { CategoryPicker } from "@/components/transactions/category-picker";
import { CategoryBadge } from "@/components/category-badge";
import { formatIsoDate } from "@/lib/date/utils";
import {
  createTransactionAction,
  type CreateTransactionState,
} from "@/lib/actions/transactions";

type Props = {
  categories: string[];
};

export function AddTransactionDialog({ categories }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState<
    CreateTransactionState,
    FormData
  >(createTransactionAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      setOpen(false);
      setCategory("");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setCategory("");
          setShowCategoryPicker(false);
        }
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Input
              type="date"
              name="date"
              defaultValue={formatIsoDate(new Date())}
              required
            />
            {state?.errors?.date && (
              <FieldError>{state.errors.date}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input
              type="text"
              name="description"
              placeholder="e.g., Coffee at Tim Hortons"
              required
            />
            {state?.errors?.description && (
              <FieldError>{state.errors.description}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Amount</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </InputGroup>
            {state?.errors?.amount && (
              <FieldError>{state.errors.amount}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Category</FieldLabel>
            <input type="hidden" name="category" value={category} />
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-start gap-2 font-normal"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                {category ? (
                  <CategoryBadge category={category} />
                ) : (
                  <span className="text-muted-foreground">Select...</span>
                )}
              </Button>
              {showCategoryPicker && (
                <div className="absolute left-0 top-full z-10 mt-1">
                  <CategoryPicker
                    categories={categories}
                    currentCategory={category}
                    onSelect={(cat) => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    onClose={() => setShowCategoryPicker(false)}
                  />
                </div>
              )}
            </div>
            {state?.errors?.category && (
              <FieldError>{state.errors.category}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={pending} />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
