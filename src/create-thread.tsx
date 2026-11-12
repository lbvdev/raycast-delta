import { Action, ActionPanel, Form, Icon, LaunchProps, showHUD, showToast, Toast } from "@raycast/api";
import { FormValidation, showFailureToast, useCachedPromise, useForm } from "@raycast/utils";
import { useEffect } from "react";
import { withDelta } from "./components/with-delta";
import { createThread, listOrganizations, openInDelta } from "./lib/delta";
import { getThreadDeeplink } from "./lib/threads";
import { Visibility } from "./lib/types";

interface FormValues {
  prompt: string;
  organizationId: string;
  // Form.Dropdown values are plain strings; narrowed to Visibility on submit.
  visibility: string;
}

function CreateThread(props: LaunchProps<{ draftValues: Partial<FormValues> }>) {
  const { draftValues, fallbackText } = props;
  const { data: organizations, isLoading } = useCachedPromise(listOrganizations, [], {
    failureToastOptions: { title: "Couldn't load Delta organizations" },
  });

  const { handleSubmit, itemProps, values, setValue } = useForm<FormValues>({
    initialValues: {
      prompt: draftValues?.prompt ?? fallbackText ?? "",
      organizationId: draftValues?.organizationId ?? "",
      visibility: draftValues?.visibility ?? "private",
    },
    validation: {
      prompt: FormValidation.Required,
    },
    async onSubmit(form) {
      const toast = await showToast({ style: Toast.Style.Animated, title: "Creating thread" });
      try {
        const threadId = await createThread({
          prompt: form.prompt.trim(),
          organizationId: form.organizationId || undefined,
          visibility: form.visibility as Visibility,
        });
        await openInDelta(getThreadDeeplink({ id: threadId }));
        await toast.hide();
        await showHUD("Thread created in Delta");
      } catch (e) {
        await showFailureToast(e, { title: "Couldn't create thread" });
      }
    },
  });

  // Preselect the organization Delta currently uses once the list arrives.
  useEffect(() => {
    if (!organizations?.length) {
      return;
    }
    const isKnown = organizations.some((org) => org.id === values.organizationId);
    if (!isKnown) {
      setValue("organizationId", (organizations.find((org) => org.current) ?? organizations[0]).id);
    }
  }, [organizations]);

  return (
    <Form
      isLoading={isLoading}
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Thread" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        title="Prompt"
        placeholder="Describe what the agent should work on"
        info="Delta saves the prompt as a draft. Review it and send it from Delta."
        enableMarkdown
        {...itemProps.prompt}
      />
      <Form.Separator />
      <Form.Dropdown title="Organization" info="The organization that owns the thread" {...itemProps.organizationId}>
        {(organizations ?? []).map((org) => (
          <Form.Dropdown.Item key={org.id} value={org.id} title={org.name} icon={Icon.Building} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown title="Visibility" {...itemProps.visibility}>
        <Form.Dropdown.Item value="private" title="Private" icon={Icon.Lock} />
        <Form.Dropdown.Item value="organization" title="Organization" icon={Icon.TwoPeople} />
      </Form.Dropdown>
    </Form>
  );
}

export default withDelta(CreateThread, <Form isLoading />);
