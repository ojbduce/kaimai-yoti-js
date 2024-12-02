   # For local deployment Build.
   cp .dockerignore.dev .dockerignore
   docker-compose up

   # Before production build
   cp .dockerignore .dockerignore.dev
   docker build ...

gitpushm() {
    echo "Adding all changes..."
    git add .
    
    echo "Enter commit message:"
    read message
    
    echo "Committing with message: $message"
    git commit -m "$message"
    
    echo "Pushing to remote..."
    git push
    
    echo "Done! 🚀"
}

gitpushq() {
    REMOTE=${1:-"origin"}
    
    echo "Remote selected: $REMOTE"
    echo "Available remotes:"
    git remote -v
    
    git add .
    echo "Enter commit message:"
    read message
    
    git commit -m "$message"
    git push $REMOTE $(git branch --show-current)
    echo "Done! 🚀"
}

gitpush() {
    # Set default remote to "origin" if no argument provided
    REMOTE=${1:-"origin"}
    
    git add .
    echo "Using remote: $REMOTE"
    
    echo "Enter commit message:"
    read message
    
    git commit -m "$message"
    git push $REMOTE $(git branch --show-current)
    echo "Done! 🚀"
}