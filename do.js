document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskButton = document.getElementById('add-task-button');
    const taskList = document.getElementById('task-list');
    const themeToggleButton = document.getElementById('theme-toggle');
    const filterButtons = document.querySelectorAll('.filter-button');
    const clearCompletedButton = document.getElementById('clear-completed-button');
    const emptyStateMessage = document.getElementById('empty-state-message');

    // --- Persistence (Local Storage) ---
    const TASKS_STORAGE_KEY = 'advanced_todo_tasks';
    const THEME_STORAGE_KEY = 'advanced_todo_theme';
    let currentFilter = 'all'; // Default filter

    function saveTasks(tasks) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }

    function loadTasks() {
        const tasksString = localStorage.getItem(TASKS_STORAGE_KEY);
        return tasksString ? JSON.parse(tasksString) : [];
    }

    function saveTheme(theme) {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    function loadTheme() {
        return localStorage.getItem(THEME_STORAGE_KEY) || 'light'; // Default to light
    }

    // --- Date Formatting Helper ---
    function formatTaskDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) { // Check if date is invalid
            return ''; // Or handle invalid date display
        }
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

        // Check if the date is today
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // Check if the date was yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // Check if the date is within the last 7 days
        if (now - date < 7 * oneDay) {
            return `${date.toLocaleDateString([], { weekday: 'short' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        // Otherwise, return full date
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // --- Render Tasks ---
    function renderTasks() {
        const tasks = loadTasks();
        taskList.innerHTML = ''; // Clear current list

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') {
                return !task.completed;
            } else if (currentFilter === 'completed') {
                return task.completed;
            }
            return true; // 'all' filter
        });

        if (filteredTasks.length === 0) {
            emptyStateMessage.style.display = 'block';
            if (currentFilter === 'active' && tasks.every(t => t.completed)) {
                emptyStateMessage.textContent = 'All tasks completed! 🎉';
            } else if (currentFilter === 'completed' && tasks.every(t => !t.completed)) {
                emptyStateMessage.textContent = 'No completed tasks yet.';
            } else if (tasks.length > 0 && (currentFilter === 'active' || currentFilter === 'completed')) {
                 emptyStateMessage.textContent = `No ${currentFilter} tasks found.`;
            } else {
                emptyStateMessage.textContent = 'No tasks yet! Add something to get started.';
            }

        } else {
            emptyStateMessage.style.display = 'none';
        }


        filteredTasks.forEach((task, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('task-item');
            if (task.completed) {
                listItem.classList.add('completed');
            }

            // Find the original index to update/delete correctly
            const originalIndex = tasks.findIndex(t => t.id === task.id);

            listItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} data-original-index="${originalIndex}">
                <span>${task.text}</span>
                <div class="task-actions">
                    ${task.createdAt ? `<span class="task-date">${formatTaskDate(task.createdAt)}</span>` : ''}
                    <button class="delete-button" data-original-index="${originalIndex}" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            taskList.appendChild(listItem);
        });
    }

    // --- Add Task ---
    addTaskButton.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            const tasks = loadTasks();
            tasks.push({
                id: Date.now(), // Unique ID for persistence and manipulation
                text: taskText,
                completed: false,
                createdAt: new Date().toISOString() // Store as ISO string for consistency
            });
            saveTasks(tasks);
            taskInput.value = ''; // Clear input
            renderTasks();
        } else {
            // Add a subtle visual cue for empty input
            taskInput.style.borderColor = 'var(--delete-button-bg)';
            taskInput.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.2)';
            setTimeout(() => {
                taskInput.style.borderColor = '';
                taskInput.style.boxShadow = '';
            }, 1000);
        }
    });

    // Allow adding tasks with Enter key
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTaskButton.click();
        }
    });

    // --- Mark Task as Complete/Incomplete & Delete Task ---
    taskList.addEventListener('click', (e) => {
        let tasks = loadTasks();

        // Handle checkbox click
        if (e.target.type === 'checkbox') {
            const originalIndex = parseInt(e.target.dataset.originalIndex);
            tasks[originalIndex].completed = e.target.checked;
            saveTasks(tasks);
            renderTasks(); // Re-render to apply 'completed' class

            if (e.target.checked) {
                // Confetti effect!
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }

        // Handle delete button click
        if (e.target.closest('.delete-button')) {
            const button = e.target.closest('.delete-button');
            const originalIndex = parseInt(button.dataset.originalIndex);

            // Add a fading out effect before removal
            const listItem = button.closest('.task-item');
            listItem.style.opacity = '0';
            listItem.style.transform = 'translateX(20px)';
            listItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

            setTimeout(() => {
                tasks.splice(originalIndex, 1); // Remove 1 element at the given index
                saveTasks(tasks);
                renderTasks(); // Re-render the list after animation
            }, 300); // Match CSS transition duration
        }
    });

    // --- Dark/Light Mode Toggle ---
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        saveTheme(theme);
        // Update button text/icons if necessary (though CSS handles icon switching)
        // themeToggleButton.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // --- Task Filtering ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all filters
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked filter
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks(); // Re-render tasks based on new filter
        });
    });

    // --- Clear All Completed Tasks ---
    clearCompletedButton.addEventListener('click', () => {
        let tasks = loadTasks();
        const activeTasks = tasks.filter(task => !task.completed);

        if (activeTasks.length < tasks.length) {
            if (confirm('Are you sure you want to clear all completed tasks?')) {
                saveTasks(activeTasks);
                renderTasks();
            }
        } else {
            alert('No completed tasks to clear!');
        }
    });


    // --- Initialize application ---
    const initialTheme = loadTheme();
    applyTheme(initialTheme);
    renderTasks(); // Initial render of tasks
});