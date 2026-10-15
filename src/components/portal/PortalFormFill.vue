<template>
  <div class="form-fill">
    <div
      v-if="isLocked"
      class="form-fill__done"
      :style="{
        borderColor: 'color-mix(in srgb, var(--p-accent) 35%, transparent)',
        background: 'var(--p-accent-bg)',
      }"
    >
      Submitted<template v-if="form.submittedAt"> on {{ formatDateTime(form.submittedAt) }}</template>.
      Need to change something? Ask the studio to reopen it.
    </div>

    <p
      v-if="form.description"
      class="form-fill__intro"
      :style="{ color: 'var(--p-muted)' }"
    >
      {{ form.description }}
    </p>

    <form class="form-fill__fields" novalidate @submit.prevent="submit">
      <template v-for="field in form.fields" :key="field.id">
        <h2 v-if="field.type === 'heading'" class="form-fill__heading">
          {{ field.label }}
        </h2>

        <div v-else class="form-fill__field" :class="{ 'is-missing': missingIds.has(field.id) }">
          <label :for="`field-${field.id}`" class="form-fill__label">
            {{ field.label }}
            <span v-if="field.required" class="form-fill__required">*</span>
          </label>
          <p
            v-if="field.helpText"
            class="form-fill__help"
            :style="{ color: 'var(--p-muted)' }"
          >
            {{ field.helpText }}
          </p>

          <p v-if="isLocked" class="form-fill__answer">
            {{ displayAnswer(field) }}
          </p>

          <textarea
            v-else-if="field.type === 'long_text'"
            :id="`field-${field.id}`"
            v-model="textAnswers[field.id]"
            class="form-fill__textarea"
            rows="4"
            maxlength="5000"
          />

          <div
            v-else-if="field.type === 'single_choice' || field.type === 'multiple_choice'"
            class="form-fill__choices"
            :role="field.type === 'single_choice' ? 'radiogroup' : 'group'"
            :aria-label="field.label"
          >
            <button
              v-for="option in field.options ?? []"
              :key="option"
              type="button"
              class="form-fill__choice"
              :role="field.type === 'single_choice' ? 'radio' : 'checkbox'"
              :aria-checked="isChosen(field, option)"
              @click="toggleChoice(field, option)"
            >
              <span
                class="form-fill__box"
                :class="field.type === 'single_choice' ? 'is-round' : ''"
                :style="
                  isChosen(field, option)
                    ? { background: 'var(--p-text)', borderColor: 'var(--p-text)', color: 'var(--p-shell)' }
                    : { borderColor: 'color-mix(in srgb, var(--p-border) 70%, transparent)' }
                "
              >
                <Check v-if="isChosen(field, option)" class="h-3 w-3" />
              </span>
              <span>{{ option }}</span>
            </button>
          </div>

          <select
            v-else-if="field.type === 'dropdown'"
            :id="`field-${field.id}`"
            v-model="textAnswers[field.id]"
            class="form-fill__input"
          >
            <option value="">Choose</option>
            <option v-for="option in field.options ?? []" :key="option" :value="option">
              {{ option }}
            </option>
          </select>

          <input
            v-else
            :id="`field-${field.id}`"
            v-model="textAnswers[field.id]"
            class="form-fill__input"
            :type="inputType(field)"
            :inputmode="field.type === 'number' ? 'decimal' : undefined"
            :autocomplete="field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'off'"
            maxlength="500"
          />
        </div>
      </template>

      <template v-if="!isLocked">
        <p v-if="message" class="form-fill__message" :class="{ 'is-error': isError }">
          {{ message }}
        </p>
        <div class="form-fill__actions">
          <button
            type="submit"
            class="form-fill__cta"
            :style="{ background: 'var(--p-text)', color: 'var(--p-shell)' }"
            :disabled="isBusy"
          >
            {{ busyAction === "submit" ? "Submitting..." : "Submit" }}
          </button>
          <button
            type="button"
            class="form-fill__secondary"
            :style="{ borderColor: 'color-mix(in srgb, var(--p-border) 70%, transparent)' }"
            :disabled="isBusy"
            @click="saveDraft"
          >
            {{ busyAction === "save" ? "Saving..." : "Save for later" }}
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Check } from "lucide-vue-next";
import type {
  PortalForm,
  PortalFormAnswers,
  PortalFormField,
} from "@/services/portal.service";

const props = defineProps<{
  form: PortalForm;
  saveFn: (answers: PortalFormAnswers) => Promise<PortalForm>;
  submitFn: (answers: PortalFormAnswers) => Promise<PortalForm>;
}>();

const emit = defineEmits<{
  updated: [PortalForm];
}>();

const textAnswers = reactive<Record<string, string>>({});
const choiceAnswers = reactive<Record<string, string[]>>({});
const busyAction = ref<"save" | "submit" | null>(null);
const message = ref("");
const isError = ref(false);
const missingIds = ref(new Set<string>());

const isLocked = computed(() => props.form.status === "submitted");
const isBusy = computed(() => busyAction.value !== null);

watch(
  () => props.form,
  (form) => {
    for (const field of form.fields) {
      if (field.type === "heading") continue;
      const value = form.answers[field.id];
      if (field.type === "multiple_choice") {
        choiceAnswers[field.id] = Array.isArray(value) ? [...value] : [];
      } else {
        textAnswers[field.id] = typeof value === "string" ? value : "";
      }
    }
  },
  { immediate: true },
);

function inputType(field: PortalFormField) {
  if (field.type === "date") return "date";
  if (field.type === "time") return "time";
  if (field.type === "email") return "email";
  if (field.type === "phone") return "tel";
  return "text";
}

function isChosen(field: PortalFormField, option: string) {
  return field.type === "multiple_choice"
    ? (choiceAnswers[field.id] ?? []).includes(option)
    : textAnswers[field.id] === option;
}

function toggleChoice(field: PortalFormField, option: string) {
  if (field.type === "multiple_choice") {
    const current = choiceAnswers[field.id] ?? [];
    choiceAnswers[field.id] = current.includes(option)
      ? current.filter((value) => value !== option)
      : [...current, option];
    return;
  }
  textAnswers[field.id] = textAnswers[field.id] === option ? "" : option;
}

function collectAnswers(): PortalFormAnswers {
  const answers: PortalFormAnswers = {};
  for (const field of props.form.fields) {
    if (field.type === "heading") continue;
    if (field.type === "multiple_choice") {
      const values = choiceAnswers[field.id] ?? [];
      if (values.length) answers[field.id] = values;
    } else {
      const value = (textAnswers[field.id] ?? "").trim();
      if (value) answers[field.id] = value;
    }
  }
  return answers;
}

function displayAnswer(field: PortalFormField) {
  const value = props.form.answers[field.id];
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (!value) return "-";
  if (field.type === "date") {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" });
    }
  }
  return value;
}

async function run(action: "save" | "submit") {
  message.value = "";
  isError.value = false;
  const answers = collectAnswers();

  if (action === "submit") {
    const missing = props.form.fields.filter(
      (field) => field.type !== "heading" && field.required && !(field.id in answers),
    );
    missingIds.value = new Set(missing.map((field) => field.id));
    if (missing.length) {
      isError.value = true;
      message.value = `Please answer: ${missing.map((field) => field.label).join(", ")}`;
      return;
    }
  }

  busyAction.value = action;
  try {
    const updated = await (action === "submit" ? props.submitFn : props.saveFn)(answers);
    if (action === "save") message.value = "Saved. You can come back and finish later.";
    emit("updated", updated);
  } catch (caught: unknown) {
    isError.value = true;
    message.value = caught instanceof Error ? caught.message : "Unable to save your answers.";
  } finally {
    busyAction.value = null;
  }
}

const saveDraft = () => run("save");
const submit = () => run("submit");

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
</script>

<style scoped>
.form-fill {
  display: grid;
  gap: 1.75rem;
}

.form-fill__done {
  border: 1px solid;
  padding: 1rem 1.1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.form-fill__intro {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-line;
}

.form-fill__fields {
  display: grid;
  gap: 1.75rem;
}

.form-fill__heading {
  margin: 0.75rem 0 0;
  font-family: "Cormorant Garamond", serif;
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1.2;
}

.form-fill__field {
  display: grid;
  gap: 0.5rem;
}

.form-fill__label {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.4;
}

.form-fill__required,
.form-fill__field.is-missing .form-fill__label {
  color: #c45c5c;
}

.form-fill__help {
  margin: -0.2rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
}

.form-fill__answer {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.form-fill__input,
.form-fill__textarea {
  width: 100%;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--p-border) 60%, transparent);
  border-radius: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  font-size: 0.95rem;
  color: var(--p-text);
  outline: none;
  transition: border-color 250ms ease;
}

.form-fill__input {
  height: 2.75rem;
}

.form-fill__textarea {
  padding: 0.5rem 0;
  resize: vertical;
  line-height: 1.55;
}

.form-fill__input:focus,
.form-fill__textarea:focus {
  border-bottom-color: var(--p-accent);
}

.form-fill__field.is-missing .form-fill__input,
.form-fill__field.is-missing .form-fill__textarea {
  border-bottom-color: #c45c5c;
}

.form-fill__input option {
  color: initial;
}

.form-fill__choices {
  display: grid;
  gap: 0.7rem;
}

.form-fill__choice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  font-size: 0.92rem;
  line-height: 1.45;
  color: inherit;
  cursor: pointer;
}

.form-fill__box {
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.12rem;
  border: 1px solid;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background 160ms ease, border-color 160ms ease;
}

.form-fill__box.is-round {
  border-radius: 999px;
}

.form-fill__message {
  margin: 0;
  font-size: 0.85rem;
}

.form-fill__message.is-error {
  color: #c45c5c;
}

.form-fill__actions {
  display: grid;
  gap: 0.75rem;
}

.form-fill__cta,
.form-fill__secondary {
  display: inline-flex;
  width: 100%;
  height: 3.15rem;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: opacity 180ms ease, transform 180ms ease;
}

.form-fill__cta {
  border: 0;
}

.form-fill__secondary {
  border: 1px solid;
  background: transparent;
  color: var(--p-text);
}

.form-fill__cta:hover:not(:disabled),
.form-fill__secondary:hover:not(:disabled) {
  opacity: 0.94;
  transform: translateY(-1px);
}

.form-fill__cta:disabled,
.form-fill__secondary:disabled {
  opacity: 0.65;
  cursor: wait;
}
</style>
