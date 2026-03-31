document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('project-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('project-id').value;
        const data = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            tech_stack: document.getElementById('tech_stack').value,
            image_url: document.getElementById('image_url').value,
            demo_link: document.getElementById('demo_link').value
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/projects/${id}` : '/api/projects';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                window.location.reload();
            } else {
                alert('ERROR_IN_TRANSMISSION: ' + (result.error || 'Unknown'));
            }
        } catch (error) {
            console.error(error);
            alert('SYSTEM_ERROR.');
        }
    });

    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = '';
        document.getElementById('form-title').innerHTML = '<span class="mr-2">&gt;</span> [ ADD_RECORD ]';
        document.getElementById('cancel-edit').classList.add('hidden');
    });
});

function editProject(id, title, desc, tech, img, demo) {
    document.getElementById('project-id').value = id;
    document.getElementById('title').value = title;
    document.getElementById('description').value = desc.replace(/\\n/g, '\n');
    document.getElementById('tech_stack').value = tech;
    document.getElementById('image_url').value = img;
    document.getElementById('demo_link').value = demo;
    
    document.getElementById('form-title').innerHTML = `<span class="mr-2 text-ciaRed blink">&gt;</span> [ EDIT_RECORD_SYS_ID_${id} ]`;
    document.getElementById('cancel-edit').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProject(id) {
    if (confirm(`CRITICAL_WARNING: Drop record SYS_ID_${id}? This action is irreversible.`)) {
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert('SYSTEM_ERROR.');
        }
    }
}
