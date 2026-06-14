import React from "react";
import { useNavigate } from "react-router-dom";
import { addStory } from "../data/storyService";
import StoryEditor from "./StoryEditor";

export default function UploadStory() {
  const navigate = useNavigate();

  return (
    <StoryEditor
      heading="Upload a New Story"
      pageClassName="upload-page"
      formClassName="upload-form"
      initialValues={{
        title: "",
        subtitle: "",
        content: "",
        date: "",
        published: true,
      }}
      requireDate={false}
      submitLabel="Add New Story"
      submitBusyLabel="Saving..."
      cancelLabel="Cancel"
      onCancel={() => navigate("/")}
      onSubmit={async (values) => {
        const created = await addStory(values);
        navigate(`/stories/${created.id}`);
      }}
    />
  );
}

