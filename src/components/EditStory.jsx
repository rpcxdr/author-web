import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStory, updateStory } from "../data/storyService";
import StoryEditor from "./StoryEditor";

export default function EditStory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStory(id);
        if (!mounted) return;
        setInitialValues({
          title: data?.title || "",
          subtitle: data?.subtitle || "",
          date: data?.date || "",
          published: data?.published === false || data?.published === "false" ? false : true,
          content: data?.content || "",
        });
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load story");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="center small">Loading story...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!initialValues) return <div style={{ color: "red" }}>Error: Story not found</div>;

  return (
    <StoryEditor
      key={id}
      heading="Edit Story"
      pageClassName="edit-page"
      initialValues={initialValues}
      requireDate={true}
      submitLabel="Save"
      submitBusyLabel="Saving..."
      cancelLabel="Cancel"
      onCancel={() => navigate(-1)}
      onSubmit={async (values) => {
        await updateStory(id, values);
        navigate("/");
      }}
    />
  );
}

