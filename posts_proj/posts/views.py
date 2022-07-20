from operator import ne
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render

from django.core import serializers
from .models import Post, Photo
from .forms import PostForm
from profiles.models import Profile

from .utils import action_permission
from django.contrib.auth.decorators import login_required

# Create your views here.


@login_required
def post_list_and_create(request):
    form = PostForm(request.POST or None)

    if request.is_ajax():
        if form.is_valid():
            author = Profile.objects.get(user=request.user)
            instance = form.save(commit=False)
            instance.author = author
            instance.save()

            return JsonResponse({
                'title': instance.title,
                'body': instance.body,
                'author': instance.author.user.username,
                'id': instance.id,
            })

    context = {
        'form': form,
    }
    return render(request, 'posts/main.html', context)


@login_required
def load_post_data_view(request, num_posts):
    if request.is_ajax():
        upper = num_posts
        visible = 3
        lower = upper - visible
        size = Post.objects.all().count()
        
        qs = Post.objects.all()
        data = []
        for element in qs:
            item = {
                'id': element.id,
                'title': element.title,
                'body': element.body,
                'liked': True if request.user in element.liked.all() else False,
                'count': element.like_count,
                'author': element.author.user.username
            }
            data.append(item)
        
        return JsonResponse({'data': data[lower:upper], 'size': size})

def post_detail_data_view(request, pk):
    obj = Post.objects.get(pk=pk)
    data = {
        'id': obj.id,
        'title': obj.title,
        'body': obj.body,
        'author': obj.author.user.username,
        'logged_in': request.user.username
    }
    return JsonResponse({'data': data})

@login_required
def post_detail(request, pk):
    obj = Post.objects.get(pk=pk)
    form = PostForm()

    context = {
        'obj': obj,
        'form': form,
    }

    return render(request, 'posts/detail.html', context)

def like_unlike_posts(request):
    if request.is_ajax():
        pk = request.POST.get("pk")
        object = Post.objects.get(pk=pk)
        if request.user in object.liked.all():
            liked = False
            object.liked.remove(request.user)
        else:
            liked = True
            object.liked.add(request.user)

        return JsonResponse({'liked': liked, 'count': object.like_count})


def update_post(request,pk):
    obj = Post.objects.get(pk=pk)
    if request.is_ajax():
        new_title = request.POST.get('title')
        new_body = request.POST.get('body')
        obj.title = new_title
        obj.body = new_body
        obj.save()
        
        return JsonResponse({
            'title': new_title,
            'body': new_body,
        })

@action_permission
def delete_post(request, pk):
    obj = Post.objects.get(pk=pk)
    if request.is_ajax():
        obj.delete()

        return JsonResponse({})

def image_upload_view(request):
    print(request)
    if request.method == 'POST':
        img = request.FILES.get('file')
        new_post_id = request.POST.get('new_post_id')
        print(new_post_id)
        post = Post.objects.get(id=new_post_id)
        Photo.objects.create(image=img, post=post)
    return HttpResponse()