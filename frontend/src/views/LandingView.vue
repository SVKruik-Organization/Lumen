<script lang="ts">
import { fetchSend } from '@/utils/fetch';
import { initNotification } from '@/utils/notification';
import { defineComponent } from 'vue';

export default defineComponent({
    name: "LandingView",
    data() {
        return {
            username: "",
            title: "",
            message: ""
        };
    },
    methods: {
        async subscribe(): Promise<void> {
            if (!this.username.length) return alert('Please enter your username.');
            const response: boolean = await initNotification(this.username);
            console.log(`Subscribed: ${response}`);
        },
        async send(): Promise<void> {
            if (!this.username.length || !this.title.length || !this.message.length) return alert('Please fill the required fields.');
            const response: boolean = await fetchSend(this.username, this.title, this.message);
            console.log(`Notification sent: ${response}`);
        }
    }
});
</script>

<template>
    <main class="content-parent flex-col">
        <article class="flex-col">
            <h2>Push Notification Test</h2>
        </article>
        <form class=flex-col>
            <strong>Subscribing</strong>
            <input v-model="username" required type="text" placeholder="Enter your username." />
            <button type="submit" @click.prevent="subscribe">Subscribe</button>
        </form>
        <form class="flex-col">
            <strong>Sending</strong>
            <input v-model="title" required type="text" placeholder="Enter your message title." />
            <input v-model="message" required type="text" placeholder="Enter your message content." />
            <button type="button" @click.prevent="send">Send</button>
        </form>
    </main>
</template>

<style scoped>
main {
    padding: 10px;
    gap: 20px;
}
</style>
