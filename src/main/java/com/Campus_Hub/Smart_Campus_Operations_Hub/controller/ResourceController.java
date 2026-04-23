package com.Campus_Hub.Smart_Campus_Operations_Hub.controller;

import com.Campus_Hub.Smart_Campus_Operations_Hub.model.Resource;
import com.Campus_Hub.Smart_Campus_Operations_Hub.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;

    @GetMapping
    public ResponseEntity<List<Resource>> getAll() {
        return ResponseEntity.ok(resourceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getById(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Resource> create(@RequestBody Resource resource) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceRepository.save(resource));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> update(@PathVariable Long id, @RequestBody Resource resource) {
        if (!resourceRepository.existsById(id)) return ResponseEntity.notFound().build();
        resource.setId(id);
        return ResponseEntity.ok(resourceRepository.save(resource));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!resourceRepository.existsById(id)) return ResponseEntity.notFound().build();
        resourceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

