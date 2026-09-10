<script lang="ts" setup>
import featureData from '@/static/features.json';

type Feature = { id: number; title: string; icon: string };

const props = withDefaults(defineProps<{
    set?: 'index' | 'more' | 'items' | 'basic_features' | 'standard_features' | 'premium_features';
    addedMoreFeatures?: Feature[];
    textSize?: string;
    alignment?: string;
}>(), {
    set: 'index',
    addedMoreFeatures: () => [],
    textSize: 'md:text-xl text:xs',
    alignment: 'grid md:grid-cols-2 grid-cols-2 gap-x-[2.1rem] gap-y-[0.35rem]'
});

const features = computed<Feature[]>(() => [
    ...featureData.features[props.set],
    ...props.addedMoreFeatures
]);
</script>

<template>
    <div class="pl-1 text-black " :class="props.alignment">
        <div v-for="feature in features" :key="feature.title" class="flex items-center space-x-4">
            <img :src="feature.icon === 'mot-history.svg' ? '/assets/svg/mot-history.svg' : `/svg/${feature.icon}`"
                class="size-5 object-contain" alt="">
            <p class="md:tracking-wider font-extralight" :class="props.textSize">{{ feature.title }}</p>
        </div>
    </div>
</template>
