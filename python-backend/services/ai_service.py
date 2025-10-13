from transformers import pipeline, Conversation
import torch

class AIService:
    def __init__(self):
        self.chatbot = None
        self.text_generator = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
    
    def load_chatbot(self):
        """Load conversational AI model"""
        if self.chatbot is None:
            try:
                print("Loading AI chatbot model...")
                self.chatbot = pipeline(
                    'conversational',
                    model='microsoft/DialoGPT-medium',
                    device=0 if self.device == "cuda" else -1
                )
                print("Chatbot loaded successfully")
            except Exception as e:
                print(f"Failed to load chatbot: {str(e)}")
                self.chatbot = None
    
    def load_text_generator(self):
        """Load text generation model"""
        if self.text_generator is None:
            try:
                print("Loading text generation model...")
                self.text_generator = pipeline(
                    'text-generation',
                    model='gpt2',
                    device=0 if self.device == "cuda" else -1
                )
                print("Text generator loaded successfully")
            except Exception as e:
                print(f"Failed to load text generator: {str(e)}")
                self.text_generator = None
    
    async def chat(self, message: str, conversation_history: list = None) -> dict:
        """Generate AI chat response"""
        try:
            # Load chatbot if not loaded
            if self.chatbot is None:
                self.load_chatbot()
            
            if self.chatbot is None:
                return {
                    "success": False,
                    "message": "AI chatbot is not available. Using fallback responses.",
                    "response": self._get_fallback_response(message)
                }
            
            # Create conversation
            conversation = Conversation(message)
            
            # Add history if provided
            if conversation_history:
                for msg in conversation_history[-5:]:  # Last 5 messages
                    conversation.add_user_input(msg.get("user", ""))
                    if msg.get("assistant"):
                        conversation.mark_processed()
            
            # Generate response
            result = self.chatbot(conversation)
            response_text = result.generated_responses[-1] if result.generated_responses else "I'm here to help with your video editing!"
            
            return {
                "success": True,
                "response": response_text,
                "model": "DialoGPT-medium"
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": f"Chat failed: {str(e)}",
                "response": self._get_fallback_response(message)
            }
    
    async def generate_script(self, topic: str, script_type: str = "general") -> dict:
        """Generate video script"""
        try:
            # Load text generator if not loaded
            if self.text_generator is None:
                self.load_text_generator()
            
            if self.text_generator is None:
                return {
                    "success": False,
                    "error": "Text generator is not available"
                }
            
            # Create prompt based on script type
            prompts = {
                "title": f"10 engaging video titles about {topic}:\n1.",
                "outline": f"Video outline for {topic}:\nIntroduction:",
                "full": f"Complete video script about {topic}:\n\nHook:",
                "voiceover": f"Voiceover script for {topic}:\n\n"
            }
            
            prompt = prompts.get(script_type, f"Create content about {topic}:")
            
            # Generate text
            result = self.text_generator(
                prompt,
                max_length=200,
                num_return_sequences=1,
                temperature=0.8,
                do_sample=True
            )
            
            generated_text = result[0]['generated_text']
            
            return {
                "success": True,
                "script": generated_text,
                "type": script_type,
                "model": "GPT-2"
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Script generation failed: {str(e)}"
            }
    
    async def generate_titles(self, topic: str, count: int = 10) -> dict:
        """Generate video title suggestions"""
        try:
            # Load text generator if not loaded
            if self.text_generator is None:
                self.load_text_generator()
            
            if self.text_generator is None:
                # Return predefined titles as fallback
                return {
                    "success": True,
                    "titles": self._get_fallback_titles(topic),
                    "model": "fallback"
                }
            
            prompt = f"Creative and engaging video titles about {topic}:\n1."
            
            result = self.text_generator(
                prompt,
                max_length=150,
                num_return_sequences=min(count, 5),
                temperature=0.9,
                do_sample=True
            )
            
            titles = []
            for r in result:
                text = r['generated_text'].replace(prompt, "").strip()
                # Extract titles from generated text
                lines = text.split('\n')
                for line in lines[:count]:
                    if line.strip():
                        # Clean up the title
                        title = line.strip().lstrip('0123456789.- ')
                        if title and len(title) > 10:
                            titles.append(title)
            
            # Ensure we have at least some titles
            if len(titles) < 3:
                titles.extend(self._get_fallback_titles(topic))
            
            return {
                "success": True,
                "titles": titles[:count],
                "model": "GPT-2"
            }
        
        except Exception as e:
            return {
                "success": True,
                "titles": self._get_fallback_titles(topic),
                "model": "fallback",
                "note": "Using fallback titles due to error"
            }
    
    async def brainstorm_ideas(self, niche: str) -> dict:
        """Generate video ideas for a niche"""
        try:
            # Load text generator if not loaded
            if self.text_generator is None:
                self.load_text_generator()
            
            if self.text_generator is None:
                return {
                    "success": True,
                    "ideas": self._get_fallback_ideas(niche),
                    "model": "fallback"
                }
            
            prompt = f"Creative video ideas for {niche} content creators:\n\n1."
            
            result = self.text_generator(
                prompt,
                max_length=200,
                num_return_sequences=1,
                temperature=0.9,
                do_sample=True
            )
            
            generated_text = result[0]['generated_text']
            
            return {
                "success": True,
                "ideas": generated_text,
                "niche": niche,
                "model": "GPT-2"
            }
        
        except Exception as e:
            return {
                "success": True,
                "ideas": self._get_fallback_ideas(niche),
                "model": "fallback"
            }
    
    def _get_fallback_response(self, message: str) -> str:
        """Get fallback response when AI is not available"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['play', 'pause', 'stop']):
            return "I can help you control video playback. Try using the timeline controls or keyboard shortcuts (Space to play/pause)."
        elif any(word in message_lower for word in ['cut', 'trim', 'split']):
            return "To cut or trim your video, position the playhead where you want to split, then use the split tool in the timeline."
        elif any(word in message_lower for word in ['effect', 'filter', 'transition']):
            return "You can apply effects from the Effects panel. Try fade in/out, speed changes, or color adjustments."
        elif any(word in message_lower for word in ['caption', 'subtitle', 'transcribe']):
            return "Use the Auto Caption feature to generate subtitles automatically. It uses AI to transcribe your video's audio."
        elif any(word in message_lower for word in ['export', 'save', 'download']):
            return "To export your video, click the Export button and choose your desired format and quality settings."
        else:
            return "I'm here to help with your video editing! Try asking about cutting clips, adding effects, generating captions, or exporting your video."
    
    def _get_fallback_titles(self, topic: str) -> list:
        """Get fallback titles when AI is not available"""
        return [
            f"The Ultimate Guide to {topic}",
            f"How to Master {topic} in 2024",
            f"{topic}: Everything You Need to Know",
            f"10 Amazing Tips for {topic}",
            f"{topic} Explained Simply",
            f"The Secret to {topic} Success",
            f"{topic}: Beginner to Expert",
            f"Why {topic} Matters in 2024",
            f"{topic} - Complete Tutorial",
            f"Transform Your {topic} Skills Today"
        ]
    
    def _get_fallback_ideas(self, niche: str) -> str:
        """Get fallback ideas when AI is not available"""
        return f"""Creative Video Ideas for {niche}:

1. Behind the scenes of {niche}
2. Common mistakes in {niche} and how to avoid them
3. Day in the life of a {niche} creator
4. {niche} tools and equipment recommendations
5. Beginner's guide to {niche}
6. Advanced {niche} techniques
7. {niche} trends for 2024
8. Q&A about {niche}
9. {niche} myths debunked
10. How I got started with {niche}"""

# Create singleton instance
ai_service = AIService()

