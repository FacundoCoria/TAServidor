document.addEventListener('DOMContentLoaded', () => {
    GetTarjeta(); // Cargar tareas desde el servidor al cargar la página
});

function openAgregarModal() {
    document.getElementById('agregarModal').style.display = 'block';
}

async function GetTarjeta() {
    try {
        const response = await fetch('http://localhost:3000/api/tasks/');
        const tasks = await response.json();

        const lists = {
            'To Do': document.getElementById('to-do-list'),
            'In Progress': document.getElementById('in-progress-list'),
            'Done': document.getElementById('done-list'),
            'Backlog': document.getElementById('backlog-list'),
            'Blocked': document.getElementById('blocked-list')
        };

        // Limpiar las listas antes de añadir nuevas tareas
        Object.values(lists).forEach(list => list.innerHTML = '');

        tasks.forEach(task => {
            //console.log('Processing task:', task); // Verificar la tarea en proceso
            const taskElement = createTaskElement(task);

            taskElement.setAttribute('data-priority', task.priority)

            const taskList = lists[task.status];
            if (taskList) {
                taskList.appendChild(taskElement);
            } else {
                console.warn('Unknown status:', task.status); // Advertencia para estados desconocidos
            }
        });
    } catch (error) {
        console.error('Error al cargar las tareas desde el servidor:', error);
    }
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.draggable = true;
    taskElement.dataset.id = task.id;
    taskElement.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <p>Asignada a: ${task.assignedTo}</p>
        <p>Prioridad: ${task.priority}</p>
        <p>Estado: ${task.status}</p>
        <p>Fecha límite: ${task.deadline || 'No establecida'}</p> <!-- Mostrar fecha -->
        <button onclick="showEditModal('${task.id}')">Editar</button>
        <button onclick="deleteTask('${task.id}')">Eliminar</button>
    `;
    taskElement.addEventListener('dragstart', drag);
    return taskElement;
}

async function addTask() {
    //console.log('addTask called'); // Para depuración

    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const assignedTo = document.getElementById('assignedTo').value;
    const priority = document.getElementById('priority').value;
    const status = document.getElementById('status').value;
    const deadline = document.getElementById('deadline').value;

    if (!validarTitulo(title)) {
        return; // Detener si el título no es válido
    }

    const newTask = {
        title,
        description,
        assignedTo,
        priority,
        status,
        deadline
    };

    try {
        const response = await fetch('http://localhost:3000/api/tasks/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });

        if (response.ok) {
            console.log('Tarea agregada con éxito');
            GetTarjeta(); // Recargar las tareas después de agregar la nueva
            closeAgregarModal(); // Cierra el modal después de agregar la tarea
        } else {
            console.error('Error al agregar la tarea:', await response.text());
        }
    } catch (error) {
        console.error('Error de red al agregar la tarea:', error);
    }
}

async function editTask() {
    if (currentTask) {
        const taskId = currentTask.dataset.id; // Obtener el ID de la tarea

        const updatedTask = {
            title: document.getElementById('editTaskTitle').value,
            description: document.getElementById('editTaskDescription').value,
            assignedTo: document.getElementById('editTaskAssigned').value,
            priority: document.getElementById('editTaskPriority').value,
            startDate: document.getElementById('editTaskDueDate').value,
            endDate: document.getElementById('editTaskDueDate').value,
            status: document.getElementById('editTaskStatus').value
        };

        try {
            const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });

            if (response.ok) {
                console.log(`Tarea ${taskId} actualizada con éxito`);
                GetTarjeta(); // Recargar las tareas después de la actualización
                closeEditModal(); // Cierra el modal después de editar la tarea
            } else {
                console.error('Error al actualizar la tarea:', await response.text());
            }
        } catch (error) {
            console.error('Error de red al actualizar la tarea:', error);
        }
    } else {
        console.error('No hay una tarea seleccionada para editar.');
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log(`Tarea ${taskId} eliminada con éxito`);
            GetTarjeta(); // Recargar las tareas después de eliminar
        } else {
            console.error('Error al eliminar la tarea:', await response.text());
        }
    } catch (error) {
        console.error('Error de red al eliminar la tarea:', error);
    }
}

function showEditModal(taskId) {
    currentTask = document.querySelector(`[data-id='${taskId}']`);
    if (currentTask) {
        const title = currentTask.querySelector('h3').textContent;
        const description = currentTask.querySelector('p').textContent;
        const assignedTo = currentTask.querySelector('p:nth-child(3)').textContent.split(': ')[1];
        const priority = currentTask.querySelector('p:nth-child(4)').textContent.split(': ')[1];
        const status = currentTask.querySelector('p:nth-child(5)').textContent.split(': ')[1];
        const deadline = currentTask.querySelector('p:nth-child(6)')?.textContent.split(': ')[1] || '';

        document.getElementById('editTaskTitle').value = title;
        document.getElementById('editTaskDescription').value = description;
        document.getElementById('editTaskAssigned').value = assignedTo;
        document.getElementById('editTaskPriority').value = priority;
        document.getElementById('editTaskStatus').value = status;
        document.getElementById('editTaskDueDate').value = deadline;
        document.getElementById('Editar').style.display = 'block';
    } 
}

function closeAgregarModal() {
    document.getElementById('agregarModal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('Editar').style.display = 'none';
    currentTask = null; // Limpiar la referencia de la tarea actual
}


function drag(event) {
    event.dataTransfer.setData('text', event.target.dataset.id);
}

function allowDrop(event) {
    event.preventDefault();
}

function validarTitulo(title) {
    return title.trim() !== '';
}

async function drop(event, status) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text');

    try {
        const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            console.log(`Tarea ${taskId} movida a ${status}`);
            GetTarjeta(); // Recargar las tareas después de mover
        } else {
            console.error('Error al mover la tarea:', await response.text());
        }
    } catch (error) {
        console.error('Error de red al mover la tarea:', error);
    }
}