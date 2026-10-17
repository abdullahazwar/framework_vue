<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  addDays,
  formatDate,
  isDateKey,
  startOfWeek,
} from '../domain/dates.ts';
import { filterTasks } from '../domain/selectors.ts';
import { useToday } from '../composables/useToday.ts';
import { useWorkspaceStore } from '../features/workspace/store.ts';
import { useOverlayStore } from '../features/workspace/overlays.ts';
import PageHeading from '../components/PageHeading.vue';
import AppIcon from '../components/AppIcon.vue';
import TaskRow from '../features/tasks/TaskRow.vue';

const store = useWorkspaceStore();
const overlays = useOverlayStore();
const today = useToday();
const week = ref(startOfWeek(today.value));
const includeDone = ref(false);
const tasks = computed(() =>
  filterTasks(
    store.data,
    { status: includeDone.value ? 'all' : 'open' },
    today.value,
  ),
);
const days = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(week.value, index);
    return { date, tasks: tasks.value.filter((task) => task.dueDate === date) };
  }),
);
const total = computed(() =>
  days.value.reduce((sum, day) => sum + day.tasks.length, 0),
);
const undated = computed(
  () => tasks.value.filter((task) => !task.dueDate).length,
);
function setWeek(event: Event) {
  const target = event.target as HTMLInputElement;
  if (isDateKey(target.value)) week.value = startOfWeek(target.value);
  target.value = week.value;
}
</script>

<template>
  <PageHeading
    title="Beri ruang untuk yang penting."
    subtitle="Tenggat tugas dari proyek aktif, disusun menurut tanggal pada perangkat Anda."
    eyebrow="Agenda"
    ><button
      class="button"
      type="button"
      @click="overlays.open({ type: 'task' })"
    >
      <AppIcon name="plus" />Tambah tugas
    </button></PageHeading
  >
  <div class="agenda-toolbar">
    <div class="week-navigation">
      <button
        class="icon-button"
        type="button"
        aria-label="Pekan sebelumnya"
        :disabled="week < '1900-01-08'"
        @click="week = addDays(week, -7)"
      >
        <AppIcon name="left" />
      </button>
      <h2>
        {{ formatDate(week) }} —
        {{ formatDate(addDays(week, 6), { year: 'numeric' }) }}
      </h2>
      <button
        class="icon-button"
        type="button"
        aria-label="Pekan berikutnya"
        :disabled="week > '2199-12-20'"
        @click="week = addDays(week, 7)"
      >
        <AppIcon name="right" />
      </button>
    </div>
    <div class="filter-inline">
      <button
        class="button secondary"
        type="button"
        @click="week = startOfWeek(today)"
      >
        Pekan ini</button
      ><label class="sr-label"
        >Pilih tanggal pekan<input
          type="date"
          :value="week"
          min="1900-01-01"
          max="2199-12-25"
          @change="setWeek"
      /></label>
    </div>
  </div>
  <div class="results-heading">
    <p
      class="result-count"
      role="status"
    >
      {{ total }} tugas pada pekan ini
    </p>
    <label class="checkbox-field"
      ><input
        v-model="includeDone"
        type="checkbox"
      />Termasuk tugas selesai</label
    >
  </div>
  <div class="agenda-list">
    <section
      v-for="day in days"
      :key="day.date"
      class="agenda-day"
      :class="{ 'is-today': day.date === today }"
      :aria-labelledby="`day-${day.date}`"
    >
      <header>
        <h2 :id="`day-${day.date}`">
          {{ formatDate(day.date, { weekday: 'long' }) }}
        </h2>
        <span
          v-if="day.date === today"
          class="subtle-badge"
          >Hari ini</span
        ><button
          class="icon-button"
          type="button"
          :aria-label="`Tambah tugas untuk ${formatDate(day.date)}`"
          @click="overlays.open({ type: 'task', dueDate: day.date })"
        >
          <AppIcon name="plus" />
        </button>
      </header>
      <ul
        v-if="day.tasks.length"
        class="task-list"
      >
        <TaskRow
          v-for="task in day.tasks"
          :key="task.id"
          :task="task"
          show-project
        />
      </ul>
      <p
        v-else
        class="agenda-empty"
      >
        Belum ada tugas dengan tenggat pada hari ini.
      </p>
    </section>
  </div>
  <p
    v-if="undated"
    class="agenda-footnote"
  >
    <AppIcon name="inbox" /><span>{{ undated }} tugas tanpa tenggat.</span
    ><RouterLink
      class="text-link"
      to="/tasks?due=undated"
      >Tinjau tugas <AppIcon name="arrow"
    /></RouterLink>
  </p>
</template>
