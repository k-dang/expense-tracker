"use client";

import { useActionState, useEffect, useState } from "react";
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
import { SourceFieldPicker } from "@/components/income/source-field-picker";
import {
  updateIncomeAction,
  type UpdateIncomeState,
} from "@/lib/actions/income";
import type { IncomeListItem } from "@/db/queries/income";

type Props = {
  income: IncomeListItem;
  sources: string[];
  onClose: () => void;
};

export function EditIncomeDialog({ income, sources, onClose }: Props) {
  const [source, setSource] = useState(income.source);

  const [state, formAction, pending] = useActionState<
    UpdateIncomeState,
    FormData
  >(updateIncomeAction, null);

  useEffect(() => {
    if (state?.status === "success") {
      onClose();
    }
  }, [state, onClose]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit income</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={income.id} />

          <Field>
            <FieldLabel>Date</FieldLabel>
            <Input
              type="date"
              name="date"
              defaultValue={income.incomeDate}
              required
            />
            {state?.errors?.date && (
              <FieldError>{state.errors.date}</FieldError>
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
                defaultValue={(income.amountCents / 100).toFixed(2)}
                required
              />
            </InputGroup>
            {state?.errors?.amount && (
              <FieldError>{state.errors.amount}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Source</FieldLabel>
            <input type="hidden" name="source" value={source} />
            <SourceFieldPicker
              sources={sources}
              value={source}
              onValueChange={setSource}
            />
            {state?.errors?.source && (
              <FieldError>{state.errors.source}</FieldError>
            )}
          </Field>

          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={pending} />}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
